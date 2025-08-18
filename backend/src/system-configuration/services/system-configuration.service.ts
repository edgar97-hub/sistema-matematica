import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfigurationEntity } from '../entities/system-configuration.entity';
import { UpdateConfigurationDto } from '../dto/update-configuration.dto';
import { FileStorageService } from '../../file-storage/file-storage/file-storage.service';

@Injectable()
export class SystemConfigurationService {
  constructor(
    @InjectRepository(SystemConfigurationEntity)
    private systemConfigurationRepository: Repository<SystemConfigurationEntity>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async getConfiguration(): Promise<SystemConfigurationEntity> {
    let config = await this.systemConfigurationRepository.findOne({
      where: { id: 'main' },
    });
    if (!config) {
      config = this.systemConfigurationRepository.create({ id: 'main' });
      await this.systemConfigurationRepository.save(config);
    }
    return config;
  }

  async updateConfiguration(
    updateConfigDto: UpdateConfigurationDto,
    file?: Express.Multer.File,
  ): Promise<SystemConfigurationEntity> {
    const currentConfig = await this.getConfiguration();
    const updateData: Partial<SystemConfigurationEntity> = {
      ...updateConfigDto,
      welcomeCreditAmount: parseFloat(
        updateConfigDto?.welcomeCreditAmount?.toString() || '1',
      ),
      welcomeCreditEnabled: Boolean(updateConfigDto.welcomeCreditEnabled),
    };
    if (file) {
      if (currentConfig.logoUrl) {
        await this.fileStorageService.deleteFile(currentConfig.logoUrl);
      }
      const uploadResult = await this.fileStorageService.uploadFile(
        file,
        '/system',
      );

      if (!uploadResult || !uploadResult.url) {
        throw new Error('Failed to upload logo file.');
      }
      updateData.logoUrl = uploadResult.url;
    } else {
      // await this.fileStorageService.deleteFile(currentConfig.logoUrl);
      // updateData.logoUrl = null;
    }

    await this.systemConfigurationRepository.update('main', updateData);
    return this.getConfiguration();
  }
}
