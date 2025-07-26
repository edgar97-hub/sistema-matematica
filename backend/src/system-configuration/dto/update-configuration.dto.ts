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
  @Min(0)
  welcomeCreditAmount?: number;
  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}