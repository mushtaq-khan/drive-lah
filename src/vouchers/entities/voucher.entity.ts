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
import { OrderVoucher } from '../../orders/entities/order-voucher.entity';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

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

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericColumnTransformer,
  })
  minOrderValue?: number | null;

  @OneToMany(() => OrderVoucher, (orderVoucher) => orderVoucher.voucher)
  voucherOrders: OrderVoucher[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
