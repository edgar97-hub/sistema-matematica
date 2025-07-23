import { IsOptional, IsString, IsNumber, Min, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllExercisesDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(['title', 'views', 'createdAt'])
  sortKey?: 'title' | 'views' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page? = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit? = 10;
}
