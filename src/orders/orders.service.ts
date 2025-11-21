import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { DiscountType } from '../common/enums/discount-type.enum';
import { Promotion } from '../promotions/entities/promotion.entity';
import { PromotionsService } from '../promotions/promotions.service';
import { Voucher } from '../vouchers/entities/voucher.entity';
import { VouchersService } from '../vouchers/vouchers.service';
import { ApplyOrderDto } from './dto/apply-order.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { Order } from './entities/order.entity';
import { OrderPromotion } from './entities/order-promotion.entity';
import { OrderVoucher } from './entities/order-voucher.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  private readonly maxDiscountPercent: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly vouchersService: VouchersService,
    private readonly promotionsService: PromotionsService,
    configService: ConfigService,
  ) {
    this.maxDiscountPercent = Number(
      configService.get('MAX_DISCOUNT_PERCENT', 50),
    );
  }

  async applyOrderDiscount(applyOrderDto: ApplyOrderDto) {
    const subtotal = this.calculateSubtotal(applyOrderDto.items);
    if (subtotal <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    const now = new Date();

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        totalAmount: subtotal,
        discountAmount: 0,
        finalAmount: subtotal,
      });

      const appliedVouchers: OrderVoucher[] = [];
      const appliedPromotions: OrderPromotion[] = [];
      let totalDiscount = 0;

      if (applyOrderDto.voucherCode) {
        const voucher = await this.vouchersService.findByCode(
          applyOrderDto.voucherCode,
          manager,
        );
        if (!voucher) {
          throw new NotFoundException('Voucher not found');
        }
        this.ensureVoucherValid(voucher, subtotal, now);
        const voucherDiscount = this.calculateDiscountAmount(
          voucher.discountType,
          voucher.discountValue,
          subtotal,
        );
        totalDiscount += voucherDiscount;
        await this.vouchersService.incrementUsage(voucher.id, manager);
        appliedVouchers.push(manager.create(OrderVoucher, { voucher }));
      }

      if (applyOrderDto.promotionCodes?.length) {
        const seen = new Set<string>();
        for (const code of applyOrderDto.promotionCodes) {
          const normalizedCode = code.toUpperCase();
          if (seen.has(normalizedCode)) {
            throw new BadRequestException(
              `Promotion ${normalizedCode} already applied to this order`,
            );
          }
          seen.add(normalizedCode);
          const promotion = await this.promotionsService.findByCode(
            normalizedCode,
            manager,
          );
          if (!promotion) {
            throw new NotFoundException(
              `Promotion ${normalizedCode} not found`,
            );
          }
          this.ensurePromotionValid(promotion, now);
          const eligibleAmount = this.getEligibleAmount(
            promotion,
            applyOrderDto.items,
          );
          if (eligibleAmount <= 0) {
            throw new BadRequestException(
              `Promotion ${promotion.code} is not applicable to order items`,
            );
          }
          const promotionDiscount = this.calculateDiscountAmount(
            promotion.discountType,
            promotion.discountValue,
            eligibleAmount,
          );
          totalDiscount += Math.min(promotionDiscount, eligibleAmount);
          await this.promotionsService.incrementUsage(promotion.id, manager);
          appliedPromotions.push(manager.create(OrderPromotion, { promotion }));
        }
      }

      const maxDiscountAmount = (subtotal * this.maxDiscountPercent) / 100;
      const appliedDiscount = Math.min(
        totalDiscount,
        maxDiscountAmount,
        subtotal,
      );
      order.discountAmount = Number(appliedDiscount.toFixed(2));
      order.finalAmount = Number((subtotal - appliedDiscount).toFixed(2));

      order.items = applyOrderDto.items.map((item) =>
        manager.create(OrderItem, {
          productId: item.productId,
          category: item.category ? item.category.toUpperCase() : null,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        }),
      );
      order.appliedVouchers = appliedVouchers;
      order.appliedPromotions = appliedPromotions;

      const savedOrder = await manager.getRepository(Order).save(order);

      return {
        orderId: savedOrder.id,
        totalAmount: savedOrder.totalAmount,
        discountAmount: savedOrder.discountAmount,
        finalAmount: savedOrder.finalAmount,
        appliedVouchers: appliedVouchers.map((entry) => entry.voucher.code),
        appliedPromotions: appliedPromotions.map(
          (entry) => entry.promotion.code,
        ),
      };
    });
  }

  private calculateSubtotal(items: OrderItemDto[]) {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  private ensureVoucherValid(voucher: Voucher, orderTotal: number, now: Date) {
    if (voucher.expirationDate <= now) {
      throw new BadRequestException('Voucher has expired');
    }
    if (voucher.usageCount >= voucher.usageLimit) {
      throw new BadRequestException('Voucher usage limit reached');
    }
    if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
      throw new BadRequestException(
        'Voucher cannot be used below the minimum order value',
      );
    }
  }

  private ensurePromotionValid(promotion: Promotion, now: Date) {
    if (promotion.expirationDate <= now) {
      throw new BadRequestException(`Promotion ${promotion.code} has expired`);
    }
    if (promotion.usageCount >= promotion.usageLimit) {
      throw new BadRequestException(
        `Promotion ${promotion.code} usage limit reached`,
      );
    }
  }

  private calculateDiscountAmount(
    type: DiscountType,
    value: number,
    baseAmount: number,
  ) {
    if (type === DiscountType.PERCENTAGE) {
      return (baseAmount * value) / 100;
    }
    return value;
  }

  private getEligibleAmount(promotion: Promotion, items: OrderItemDto[]) {
    const eligibleCategories = promotion.eligibleCategories ?? [];
    const eligibleItems = promotion.eligibleItems ?? [];
    return items.reduce((total, item) => {
      const itemCategory = item.category?.toUpperCase();
      const itemProduct = item.productId.toUpperCase();
      const matchesCategory =
        eligibleCategories.length && itemCategory
          ? eligibleCategories.includes(itemCategory)
          : false;
      const matchesItem = eligibleItems.length
        ? eligibleItems.includes(itemProduct)
        : false;
      if (matchesCategory || matchesItem) {
        return total + item.unitPrice * item.quantity;
      }
      return total;
    }, 0);
  }
}
