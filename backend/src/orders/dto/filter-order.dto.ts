import { IsOptional, IsString, IsEnum, IsDate } from 'class-validator';
import { OrderPipelineStatus } from '../enums/order-pipeline-status.enum';
import { Type } from 'class-transformer';

export class FilterOrderDto {
  @IsOptional()
  @IsEnum(OrderPipelineStatus)
  status?: OrderPipelineStatus;

  @IsOptional()
  userId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}