import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, Length } from 'class-validator';

export class CreateEducationalSubdivisionDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  display_order: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsNotEmpty()
  educational_stage_id: number;
}

export class UpdateEducationalSubdivisionDto {
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
  display_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  educational_stage_id?: number;
}