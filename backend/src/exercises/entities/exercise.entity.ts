import { OrderEntity } from 'src/orders/entities/order.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('exercises')
export class Exercise extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Título del ejercicio.',
  })
  title: string;

  @Column({
    type: 'varchar',
    length: 512,
  })
  imageUrl1: string;

  @Column({
    type: 'varchar',
    length: 512,
  })
  imageUrl2: string;

  @Column({
    type: 'varchar',
    length: 512,
  })
  videoUrl: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  enunciadoLatexOriginal: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  enunciadoLatexNormalizado: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  ngrams: string;

  @OneToMany(() => OrderEntity, (row) => row.exercise)
  orders: OrderEntity[];
}
