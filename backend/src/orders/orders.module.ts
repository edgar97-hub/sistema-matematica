import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { UsersModule } from '../users/users.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { CreditSystemModule } from '../credit-system/credit-system.module';
import { MathProcessingModule } from 'src/math-processing/math-processing.module';
import { SystemConfigurationModule } from 'src/system-configuration/system-configuration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    UsersModule,
    FileStorageModule,
    CreditSystemModule,
    MathProcessingModule,
    SystemConfigurationModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
