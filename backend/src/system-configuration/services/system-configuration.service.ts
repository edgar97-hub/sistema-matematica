import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfigurationEntity } from '../entities/system-configuration.entity';
import { UpdateConfigurationDto } from '../dto/update-configuration.dto';

@Injectable()
export class SystemConfigurationService {
  constructor(
    @InjectRepository(SystemConfigurationEntity)
    private systemConfigurationRepository: Repository<SystemConfigurationEntity>,
  ) {}

  async getConfiguration(): Promise<SystemConfigurationEntity> {
    let config = await this.systemConfigurationRepository.findOne({ where: { id: 'main' } });
    if (!config) {
      config = this.systemConfigurationRepository.create({ id: 'main' });
      await this.systemConfigurationRepository.save(config);
    }
    return config;
  }

  async updateConfiguration(updateConfigDto: UpdateConfigurationDto): Promise<SystemConfigurationEntity> {
    await this.systemConfigurationRepository.update('main', updateConfigDto);
    return this.getConfiguration();
  }
}