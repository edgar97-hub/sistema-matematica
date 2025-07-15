import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  countrySelected: string;

  @IsNotEmpty()
  @IsString()
  educationalStageSelected: string;

  @IsOptional()
  @IsString()
  subdivisionGradeSelected?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  topic: string;
}


