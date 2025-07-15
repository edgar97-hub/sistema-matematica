import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { AdminUserEntity } from '../../admin-users/entities/admin-user.entity';
import { CreditPackageEntity } from './credit-package.entity';
import { OrderEntity } from 'src/orders/entities/order.entity';

export enum CreditTransactionAction {
  PURCHASE_SUCCESS = 'purchase_success',
  USAGE_RESOLUTION = 'usage_resolution',
  WELCOME_BONUS = 'welcome_bonus',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Entity('credit_transactions')
export class CreditTransactionEntity extends BaseEntity {
  // @ManyToOne(() => OrderEntity, { nullable: true })
  // @JoinColumn({ name: 'order_id' })
  // order: OrderEntity;

  // @Column({ type: 'int', nullable: true })
  // orderId: number;

  @OneToMany(() => OrderEntity, (transaction) => transaction.creditTransaction)
  orders: OrderEntity[];

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'target_user_id' })
  targetUser: UserEntity;

  @Column({ type: 'int' })
  targetUserId: number;

  @ManyToOne(() => AdminUserEntity, { nullable: true })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUserEntity;

  @Column({ type: 'int', nullable: true })
  adminUserId: number;

  @Column({ type: 'enum', enum: CreditTransactionAction })
  action: CreditTransactionAction;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int', default: 0 })
  balanceBefore: number;

  @Column({ type: 'int', default: 0 })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentGateway: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  gatewayTransactionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayTransactionStatus: string;

  @Column({ type: 'json', nullable: true })
  gatewayResponsePayload: any;

  @ManyToOne(() => CreditPackageEntity, { nullable: true })
  @JoinColumn({ name: 'credit_package_id' })
  creditPackage: CreditPackageEntity;

  @Column({ type: 'int', nullable: true })
  creditPackageId: number;
}
