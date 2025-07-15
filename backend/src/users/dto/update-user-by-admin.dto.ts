import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class UpdateUserByAdminDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  credits?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  countryOfOrigin?: string;
}
