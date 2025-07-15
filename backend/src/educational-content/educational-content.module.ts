import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryEntity } from './entities/country.entity';
import { EducationalStageEntity } from './entities/educational-stage.entity';
import { EducationalSubdivisionEntity } from './entities/educational-subdivision.entity';
import { CountryService } from './services/country.service';
import { EducationalStageService } from './services/educational-stage.service';
import { EducationalSubdivisionService } from './services/educational-subdivision.service';
import { CountryController } from './controllers/country.controller';
import { EducationalStageController } from './controllers/educational-stage.controller';
import { EducationalSubdivisionController } from './controllers/educational-subdivision.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CountryEntity,
      EducationalStageEntity,
      EducationalSubdivisionEntity,
    ]),
  ],
  controllers: [
    CountryController,
    EducationalStageController,
    EducationalSubdivisionController,
  ],
  providers: [
    CountryService,
    EducationalStageService,
    EducationalSubdivisionService,
  ],
  exports: [
    CountryService,
    EducationalStageService,
    EducationalSubdivisionService,
  ],
})
export class EducationalContentModule {}
