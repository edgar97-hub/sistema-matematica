import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { Exercise } from './entities/exercise.entity';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { MathProcessingModule } from 'src/math-processing/math-processing.module';
import { ParserModule } from 'src/parser/parser.module';
import { SimilarityModule } from 'src/similarity/similarity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exercise]),
    FileStorageModule,
    MathProcessingModule,
    ParserModule,
    SimilarityModule,
  ],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
