import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Expose } from 'class-transformer';
export class CreateEducationalStageDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  // @IsString()
  // @IsOptional()
  // description?: string;

  // @IsInt()
  // @IsOptional()
  // @Min(0)
  // @Max(100)
  // min_age?: number;

  // @IsInt()
  // @IsOptional()
  // @Min(0)
  // @Max(100)
  // max_age?: number;

  // @IsInt()
  // @IsNotEmpty()
  // @Min(0)
  // display_order: number;

  @IsBoolean()
  @IsOptional()
  @Expose({ name: 'isActive' })
  is_active?: boolean;

  @IsInt()
  @IsNotEmpty()
  @Expose({ name: 'countryId' })
  country_id: number;
}

export class UpdateEducationalStageDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  min_age?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  max_age?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  display_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  country_id?: number;
}
