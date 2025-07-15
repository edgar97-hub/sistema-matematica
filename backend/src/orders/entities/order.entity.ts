import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { OrderPipelineStatus } from '../enums/order-pipeline-status.enum';
import { CreditTransactionEntity } from 'src/credit-system/entities/credit-transaction.entity';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column({ type: 'int', nullable: true })
  creditTransactionId: number;

  @ManyToOne(
    () => CreditTransactionEntity,
    (creditTransaction) => creditTransaction.orders,
  )
  @JoinColumn({ name: 'creditTransaction_id' })
  creditTransaction: CreditTransactionEntity;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar' })
  countrySelected: string;

  @Column({ type: 'varchar' })
  educationalStageSelected: string;

  @Column({ type: 'varchar', nullable: true })
  subdivisionGradeSelected: string;

  @Column({ type: 'text' })
  topic: string;

  @Column({ type: 'text' })
  originalImageUrl: string;

  @Column({ type: 'text', nullable: true })
  mathpixExtraction: string;

  @Column({ type: 'json', nullable: true })
  openAiSolution: any;

  @Column({ type: 'text', nullable: true })
  audioNarrationUrl: string;

  @Column({ type: 'text', nullable: true })
  finalVideoUrl: string;

  @Column({
    type: 'enum',
    enum: OrderPipelineStatus,
    default: OrderPipelineStatus.PENDING,
  })
  status: OrderPipelineStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 1 })
  creditsConsumed: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}
