import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderPipelineStatus } from '../enums/order-pipeline-status.enum';

export class UpdateOrderStatusAdminDto {
  @IsNotEmpty()
  @IsEnum(OrderPipelineStatus)
  status: OrderPipelineStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}