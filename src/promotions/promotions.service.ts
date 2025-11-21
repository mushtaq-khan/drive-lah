import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { generateCode } from '../utils/code-generator';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Promotion } from './entities/promotion.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepository: Repository<Promotion>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto) {
    this.ensureEligibility(createPromotionDto);
    const code = (
      createPromotionDto.code ?? generateCode('PROMO')
    ).toUpperCase();
    const exists = await this.promotionsRepository.exists({ where: { code } });
    if (exists) {
      throw new BadRequestException('Promotion code already exists');
    }

    const promotion = this.promotionsRepository.create({
      ...createPromotionDto,
      code,
      eligibleCategories: this.normalize(createPromotionDto.eligibleCategories),
      eligibleItems: this.normalize(createPromotionDto.eligibleItems),
      expirationDate: new Date(createPromotionDto.expirationDate),
    });

    return this.promotionsRepository.save(promotion);
  }

  findAll() {
    return this.promotionsRepository.find();
  }

  async findAvailable() {
    const now = new Date();
    return this.promotionsRepository
      .createQueryBuilder('promotion')
      .where('promotion.expirationDate > :now', { now })
      .andWhere('promotion.usageCount < promotion.usageLimit')
      .orderBy('promotion.expirationDate', 'ASC')
      .getMany();
  }

  async findOne(id: string) {
    const promotion = await this.promotionsRepository.findOne({
      where: { id },
    });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    return promotion;
  }

  async findByCode(code: string, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Promotion)
      : this.promotionsRepository;
    return repo.findOne({ where: { code: code.toUpperCase() } });
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto) {
    if (
      updatePromotionDto.eligibleCategories?.length === 0 &&
      updatePromotionDto.eligibleItems?.length === 0
    ) {
      throw new BadRequestException(
        'Eligible categories or items are required',
      );
    }

    if (updatePromotionDto.code) {
      updatePromotionDto.code = updatePromotionDto.code.toUpperCase();
      const exists = await this.promotionsRepository.findOne({
        where: { code: updatePromotionDto.code },
      });
      if (exists && exists.id !== id) {
        throw new BadRequestException('Promotion code already exists');
      }
    }

    const promotion = await this.promotionsRepository.preload({
      id,
      ...updatePromotionDto,
      eligibleCategories: updatePromotionDto.eligibleCategories
        ? this.normalize(updatePromotionDto.eligibleCategories)
        : undefined,
      eligibleItems: updatePromotionDto.eligibleItems
        ? this.normalize(updatePromotionDto.eligibleItems)
        : undefined,
      expirationDate: updatePromotionDto.expirationDate
        ? new Date(updatePromotionDto.expirationDate)
        : undefined,
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    this.ensureEligibility(promotion);

    return this.promotionsRepository.save(promotion);
  }

  async remove(id: string) {
    const result = await this.promotionsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Promotion not found');
    }
  }

  async incrementUsage(promotionId: string, manager: EntityManager) {
    await manager
      .getRepository(Promotion)
      .increment({ id: promotionId }, 'usageCount', 1);
  }

  private ensureEligibility(data: {
    eligibleCategories?: string[] | null;
    eligibleItems?: string[] | null;
  }) {
    if (!data.eligibleCategories?.length && !data.eligibleItems?.length) {
      throw new BadRequestException(
        'At least one eligible category or item is required',
      );
    }
  }

  private normalize(values?: string[] | null) {
    return values?.map((value) => value.trim().toUpperCase()) ?? null;
  }
}
