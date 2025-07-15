import { BaseEntity } from '../../common/entities/base.entity';
import { Column, Entity } from 'typeorm';

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
    comment: 'URL relativa al archivo de imagen guardado localmente.',
  })
  imageUrl1: string;

  @Column({
    type: 'varchar',
    length: 512,
    comment: 'URL relativa al archivo de imagen guardado localmente.',
  })
  imageUrl2: string;

  @Column({
    type: 'varchar',
    length: 512,
    comment: 'URL relativa al archivo de video guardado localmente.',
  })
  videoUrl: string;
}
