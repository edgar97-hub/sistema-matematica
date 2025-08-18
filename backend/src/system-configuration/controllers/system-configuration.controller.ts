import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SystemConfigurationService } from '../services/system-configuration.service';
import { UpdateConfigurationDto } from '../dto/update-configuration.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('configuration')
// @UseGuards(JwtAuthGuard)
export class SystemConfigurationController {
  constructor(
    private readonly systemConfigurationService: SystemConfigurationService,
  ) {}

  @Get()
  getConfiguration() {
    return this.systemConfigurationService.getConfiguration();
  }

  @Patch()
  // @UseGuards(AdminGuard)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async updateConfiguration(
    @Body() updateConfigurationDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.systemConfigurationService.updateConfiguration(
      updateConfigurationDto,
      file,
    );
  }
}
