import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';

@Entity('order_vouchers')
export class OrderVoucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.appliedVouchers, {
    onDelete: 'CASCADE',
  })
  order: Order;

  @ManyToOne(() => Voucher, (voucher) => voucher.voucherOrders, { eager: true })
  voucher: Voucher;
}
