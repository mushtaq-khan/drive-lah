import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { Promotion } from '../../promotions/entities/promotion.entity';

@Entity('order_promotions')
export class OrderPromotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.appliedPromotions, {
    onDelete: 'CASCADE',
  })
  order: Order;

  @ManyToOne(() => Promotion, (promotion) => promotion.promotionOrders, {
    eager: true,
  })
  promotion: Promotion;
}
