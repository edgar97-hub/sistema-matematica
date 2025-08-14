import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { OrderPipelineStatus } from '../enums/order-pipeline-status.enum';
import { Type } from 'class-transformer';

export class FilterOrderDto {
  @IsOptional()
  @IsEnum(OrderPipelineStatus)
  status?: OrderPipelineStatus;

  @IsOptional()
  userId?: number;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}