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

// Mantén tus DTOs individuales si los usas en otros lugares o para claridad interna
export class PaginationParamsDto {
  // Renombrado para evitar conflicto con tu PaginationQueryDto original
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
}

export class FilterUserParamsDto {
  // Renombrado
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Transformar string 'true'/'false' a booleano
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean() // Validar después de la transformación
  isActive?: boolean;

  @IsOptional()
  @IsString()
  countryOfOrigin?: string;
}

export class SortUserParamsDto {
  // Renombrado
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
  field?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  direction?: 'ASC' | 'DESC';
}

export class FindAllUsersQueryDto {
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

  // Filtros (propiedades directas que coinciden con FilterUserParamsDto)
  // NestJS mapeará query params como ?email=...&name=... a estas propiedades
  @IsOptional()
  @IsString()
  email?: string;

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

  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  // Si prefieres anidar, podrías hacer esto:
  // @IsOptional()
  // @ValidateNested()
  // @Type(() => PaginationParamsDto)
  // pagination?: PaginationParamsDto;

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => FilterUserParamsDto)
  // filter?: FilterUserParamsDto;

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => SortUserParamsDto)
  // sort?: SortUserParamsDto;
}
