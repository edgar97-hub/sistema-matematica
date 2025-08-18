import { IsString, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateConfigurationDto {
  @IsOptional()
  @IsString()
  openAiPromptBase?: string;

  @IsOptional()
  @IsBoolean()
  welcomeCreditEnabled?: boolean;

  @IsOptional()
  @IsInt()
  welcomeCreditAmount?: number;
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string | null; // Add logoUrl to DTO
}
