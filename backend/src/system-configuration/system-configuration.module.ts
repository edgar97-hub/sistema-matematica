import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigurationEntity } from './entities/system-configuration.entity';
import { SystemConfigurationService } from './services/system-configuration.service';
import { SystemConfigurationController } from './controllers/system-configuration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfigurationEntity])],
  providers: [SystemConfigurationService],
  controllers: [SystemConfigurationController],
  exports: [SystemConfigurationService],
})
export class SystemConfigurationModule {}