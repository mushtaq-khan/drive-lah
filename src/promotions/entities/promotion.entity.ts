import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DiscountType } from '../../common/enums/discount-type.enum';
import { numericColumnTransformer } from '../../common/transformers/numeric.transformer';
import { OrderPromotion } from '../../orders/entities/order-promotion.entity';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column('text', { array: true, nullable: true })
  eligibleCategories?: string[] | null;

  @Column('text', { array: true, nullable: true })
  eligibleItems?: string[] | null;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  discountValue: number;

  @Column({ type: 'timestamptz' })
  expirationDate: Date;

  @Column({ type: 'int' })
  usageLimit: number;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @OneToMany(() => OrderPromotion, (orderPromotion) => orderPromotion.promotion)
  promotionOrders: OrderPromotion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
