import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateCreditPackageDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  creditAmount: number;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
