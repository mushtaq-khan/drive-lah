import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericColumnTransformer } from '../../common/transformers/numeric.transformer';
import { OrderItem } from './order-item.entity';
import { OrderVoucher } from './order-voucher.entity';
import { OrderPromotion } from './order-promotion.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  totalAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  discountAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  finalAmount: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderVoucher, (orderVoucher) => orderVoucher.order, {
    cascade: true,
  })
  appliedVouchers: OrderVoucher[];

  @OneToMany(() => OrderPromotion, (orderPromotion) => orderPromotion.order, {
    cascade: true,
  })
  appliedPromotions: OrderPromotion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
