import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import {
  CountryEntity,
  FindAllCountriesQueryDto,
} from '../entities/country.entity';
import { CreateCountryDto, UpdateCountryDto } from '../dto/country.dto';

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(CountryEntity)
    private countryRepository: Repository<CountryEntity>,
  ) {}

  async findAll(
    queryDto: FindAllCountriesQueryDto,
  ): Promise<{ data: CountryEntity[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortField,
      sortDirection,
      name,
      isActive,
    } = queryDto;

    const skip = (page - 1) * limit;

    const queryOptions: FindManyOptions<CountryEntity> = {
      skip: skip,
      take: limit,
      order: {},
      where: {},
    };

    if (sortField && sortDirection) {
      queryOptions.order = { [sortField]: sortDirection };
    } else {
      queryOptions.order = { createdAt: 'DESC' }; // Orden por defecto
    }

    if (name) {
      queryOptions.where = { ...queryOptions.where, name: ILike(`%${name}%`) }; // ILike para case-insensitive
    }

    if (isActive !== undefined) {
      queryOptions.where = { ...queryOptions.where, is_active: isActive };
    }

    const [data, total] =
      await this.countryRepository.findAndCount(queryOptions);
    return { data, total };
  }

  async findActiveCountriesForPwa(): Promise<CountryEntity[]> {
    return (
      this.countryRepository
        .createQueryBuilder('country')
        // .leftJoinAndSelect('country.educational_stages', 'stage')
        .where('country.is_active = :isActive', { isActive: true })
        // .andWhere('stage.is_active = :isActive', { isActive: true })
        .getMany()
    );
  }

  async findOne(id: number): Promise<CountryEntity> {
    const country = await this.countryRepository.findOne({ where: { id } });
    if (!country) {
      throw new NotFoundException(`Country with ID "${id}" not found`);
    }
    return country;
  }

  async create(createCountryDto: CreateCountryDto): Promise<CountryEntity> {
    const country = await this.countryRepository.findOne({
      where: { name: createCountryDto.name },
    });
    if (country) {
      throw new NotFoundException(`Country found`);
    }

    const newCountry = this.countryRepository.create(createCountryDto);
    return this.countryRepository.save(newCountry);
  }

  async update(
    id: number,
    updateCountryDto: UpdateCountryDto,
  ): Promise<CountryEntity> {
    const updatedCountry = await this.countryRepository.findOne({
      where: { id },
    });
    if (!updatedCountry) {
      throw new NotFoundException(`Country with ID "${id}" not found`);
    }
    await this.countryRepository.update(id, updateCountryDto);

    return updatedCountry;
  }

  async remove(id: number): Promise<void> {
    const result = await this.countryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Country with ID "${id}" not found`);
    }
  }

  async isValidCountry(countryName: string): Promise<boolean> {
    const country = await this.countryRepository.findOne({
      where: { name: countryName, is_active: true },
    });
    return !!country;
  }
}
