import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { CreditTransactionEntity } from '../../credit-system/entities/credit-transaction.entity';
import { UserPwaRole } from '../enums/user-pwa-role.enum';
import { OrderEntity } from 'src/orders/entities/order.entity';

@Entity('pwa_users')
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string;

  @Column({ name: 'picture_url', type: 'varchar', length: 255, nullable: true })
  pictureUrl: string;

  @Column({ type: 'int', default: 0 })
  creditBalance: number;

  @Column({
    type: 'enum',
    enum: UserPwaRole,
    default: UserPwaRole.CLIENT,
  })
  role: UserPwaRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    name: 'country_origin',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  countryOfOrigin: string;

  @OneToMany(
    () => CreditTransactionEntity,
    (transaction) => transaction.targetUser,
  )
  creditTransactions: CreditTransactionEntity[];

  @OneToMany(() => OrderEntity, (transaction) => transaction.userId)
  orders: OrderEntity[];
}
