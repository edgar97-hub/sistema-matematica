import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SystemConfigurationService } from '../services/system-configuration.service';
import { UpdateConfigurationDto } from '../dto/update-configuration.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('configuration')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemConfigurationController {
  constructor(private readonly systemConfigurationService: SystemConfigurationService) {}

  @Get()
  getConfiguration() {
    return this.systemConfigurationService.getConfiguration();
  }

  @Patch()
  updateConfiguration(@Body() updateConfigurationDto: UpdateConfigurationDto) {
    return this.systemConfigurationService.updateConfiguration(updateConfigurationDto);
  }
}