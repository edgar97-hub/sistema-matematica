import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EducationalStageService } from '../services/educational-stage.service';
import {
  CreateEducationalStageDto,
  UpdateEducationalStageDto,
} from '../dto/educational-stage.dto';

@Controller('educational-stages')
export class EducationalStageController {
  constructor(
    private readonly educationalStageService: EducationalStageService,
  ) {}

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('filter') filter?: string,
    @Query('sort') sort?: string,
  ) {
    return this.educationalStageService.findAll(page, limit, filter, sort);
  }

  @Get('by-id-country/:countryId/pwa-list')
  findActiveByCountry(@Param('countryId') countryId: string) {
    return this.educationalStageService.findActiveStagesByCountry(+countryId);
  }

  @Get('by-name-country/:countryName/pwa-list')
  findActiveStagesByCountryName(@Param('countryName') countryName: string) {
    return this.educationalStageService.findActiveStagesByCountryName(
      countryName,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.educationalStageService.findOne(+id);
  }

  @Post()
  create(@Body() createEducationalStageDto: CreateEducationalStageDto) {
    return this.educationalStageService.create(createEducationalStageDto);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEducationalStageDto: UpdateEducationalStageDto,
  ) {
    return this.educationalStageService.update(+id, updateEducationalStageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.educationalStageService.remove(+id);
  }
}
