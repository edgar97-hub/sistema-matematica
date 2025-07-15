import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { EducationalStageEntity } from './educational-stage.entity';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

@Entity('countries')
export class CountryEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 3, unique: true, nullable: true })
  code: string; // ISO 3166-1 alpha-3 code (e.g., 'PER', 'USA', 'MEX')

  @Column({ type: 'varchar', length: 255, nullable: true })
  flag_url: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  // Relationships
  @OneToMany(() => EducationalStageEntity, (stage) => stage.country)
  educational_stages: EducationalStageEntity[];
}

export class FindAllCountriesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn([
    'createdAt',
    'name',
    'email',
    'credits',
    'countryOfOrigin',
    'isActive',
  ])
  sortField?: string; // Renombrado para evitar colisión con 'sort' como objeto

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC'; // Renombrado

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value; // Devuelve el valor original si no es 'true' o 'false' para que IsBoolean pueda fallar si no es un booleano después
  })
  @IsBoolean({ message: 'isActive debe ser un booleano (true o false)' }) // Validar como booleano después de la transformación
  isActive?: boolean;
}
