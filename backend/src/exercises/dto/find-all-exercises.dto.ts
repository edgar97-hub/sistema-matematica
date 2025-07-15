import { IsOptional, IsString, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllExercisesDto {
  @IsOptional()
  @IsString()
  title?: string;

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
