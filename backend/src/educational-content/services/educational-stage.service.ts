import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationalStageEntity } from '../entities/educational-stage.entity';
import {
  CreateEducationalStageDto,
  UpdateEducationalStageDto,
} from '../dto/educational-stage.dto';

@Injectable()
export class EducationalStageService {
  constructor(
    @InjectRepository(EducationalStageEntity)
    private educationalStageRepository: Repository<EducationalStageEntity>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    filter?: string,
    sort?: string,
  ): Promise<{ data: EducationalStageEntity[]; total: number }> {
    const where: any = {};
    const order: any = {};

    if (filter) {
      where.name = { $ilike: `%${filter}%` };
    }

    if (sort) {
      const [field, direction] = sort.split(':');
      order[field] = direction.toUpperCase();
    }

    const [data, total] = await this.educationalStageRepository.findAndCount({
      where,
      order,
      take: limit,
      skip: (page - 1) * limit,
      relations: ['country'],
    });

    return { data, total };
  }

  async findActiveStagesByCountry(
    countryId: number,
  ): Promise<EducationalStageEntity[]> {
    let test = await this.educationalStageRepository
      .createQueryBuilder('stage')
      .leftJoinAndSelect('stage.country', 'country') // 'stage.country' es la propiedad de relación en EducationalStageEntity
      // .leftJoinAndSelect('stage.educational_subdivisions', 'subdivision')
      .where('stage.country_id = :countryId', { countryId })
      // .andWhere('stage.is_active = :isActive', { isActive: true })
      // .andWhere('subdivision.is_active = :isActive', { isActive: true })
      // .select([
      //   'stage.id',
      //   'stage.name',
      //   'country.name AS countryName', // Selecciona el nombre del país usando el alias 'country'
      // ])
      .getMany();

    return test;
  }

  async findActiveStagesByCountryName(
    countryName: string,
  ): Promise<EducationalStageEntity[]> {
    let test = await this.educationalStageRepository
      .createQueryBuilder('stage')
      .leftJoinAndSelect('stage.country', 'country') // 'stage.country' es la propiedad de relación en EducationalStageEntity
      // .leftJoinAndSelect('stage.educational_subdivisions', 'subdivision')
      .where('country.name = :countryName', { countryName })
      // .andWhere('stage.is_active = :isActive', { isActive: true })
      // .andWhere('subdivision.is_active = :isActive', { isActive: true })
      // .select([
      //   'stage.id',
      //   'stage.name',
      //   'country.name AS countryName', // Selecciona el nombre del país usando el alias 'country'
      // ])
      .getMany();

    return test;
  }

  async findOne(id: number): Promise<EducationalStageEntity> {
    const stage = await this.educationalStageRepository.findOne({
      where: { id },
    });
    if (!stage) {
      throw new NotFoundException(
        `Educational Stage with ID "${id}" not found`,
      );
    }
    return stage;
  }

  async create(
    createEducationalStageDto: CreateEducationalStageDto,
  ): Promise<EducationalStageEntity> {
    const newStage = this.educationalStageRepository.create(
      createEducationalStageDto,
    );
    return this.educationalStageRepository.save(newStage);
  }

  async update(
    id: number,
    updateEducationalStageDto: UpdateEducationalStageDto,
  ): Promise<EducationalStageEntity> {
    await this.educationalStageRepository.update(id, updateEducationalStageDto);
    const updatedStage = await this.educationalStageRepository.findOne({
      where: { id },
    });
    if (!updatedStage) {
      throw new NotFoundException(
        `Educational Stage with ID "${id}" not found`,
      );
    }
    return updatedStage;
  }

  async remove(id: number): Promise<void> {
    const result = await this.educationalStageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Educational Stage with ID "${id}" not found`,
      );
    }
  }
}
