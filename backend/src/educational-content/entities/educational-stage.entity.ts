import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { CountryEntity } from './country.entity';
import { EducationalSubdivisionEntity } from './educational-subdivision.entity';

@Entity('educational_stages')
export class EducationalStageEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // @Column({ type: 'int', nullable: true })
  // min_age: number;

  // @Column({ type: 'int', nullable: true })
  // max_age: number;

  // @Column({ type: 'int' })
  // display_order: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Foreign Keys
  @Column({ type: 'int' })
  countryId: number;

  // Relationships
  @ManyToOne(() => CountryEntity, (country) => country.educational_stages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity;

  @OneToMany(
    () => EducationalSubdivisionEntity,
    (subdivision) => subdivision.educationalStage,
  )
  educational_subdivisions: EducationalSubdivisionEntity[];
}
