import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionsModule } from '../promotions/promotions.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPromotion } from './entities/order-promotion.entity';
import { OrderVoucher } from './entities/order-voucher.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Order, OrderItem, OrderVoucher, OrderPromotion]),
    VouchersModule,
    PromotionsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
