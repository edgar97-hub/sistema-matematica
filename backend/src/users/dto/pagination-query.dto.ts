import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1; // 'page' es el nombre del query param

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10; // 'limit' es el nombre del query param
}
