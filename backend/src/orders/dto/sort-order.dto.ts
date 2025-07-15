import { IsOptional, IsString, IsIn } from 'class-validator';

export class SortOrderDto {
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'code', 'status', 'userId'])
  field?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  direction?: 'ASC' | 'DESC';
}