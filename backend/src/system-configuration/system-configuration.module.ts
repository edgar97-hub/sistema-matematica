import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigurationEntity } from './entities/system-configuration.entity';
import { SystemConfigurationService } from './services/system-configuration.service';
import { SystemConfigurationController } from './controllers/system-configuration.controller';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfigurationEntity]),FileStorageModule],
  providers: [SystemConfigurationService],
  controllers: [SystemConfigurationController],
  exports: [SystemConfigurationService],
})
export class SystemConfigurationModule {}