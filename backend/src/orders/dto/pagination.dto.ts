import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  Max,
  Min,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FilterOrderDto } from './filter-order.dto';
import { SortOrderDto } from './sort-order.dto';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El número de página debe ser un entero.' })
  @Min(1, { message: 'El número de página debe ser al menos 1.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un entero.' })
  @Min(1, { message: 'El límite debe ser al menos 1.' })
  @Max(50, { message: 'El límite no puede ser mayor a 50.' })
  limit?: number = 10;

  @IsOptional()
  @ValidateNested()
  @Type(() => FilterOrderDto)
  filters?: FilterOrderDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SortOrderDto)
  sort?: SortOrderDto;
}

/**
 * Define la estructura estándar para una respuesta de API paginada.
 * Es genérica para poder reutilizarse con cualquier tipo de dato (ej. OrderFE, UserFE, etc.).
 * @template T El tipo de los datos que contiene el array 'data'.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}
