import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Delete,
  UploadedFile,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ExercisesService,
  ExerciseWithMatchingTags,
} from './exercises.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { FindAllExercisesDto } from './dto/find-all-exercises.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { Exercise } from './entities/exercise.entity';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('tags')
  findAllTags() {
    return this.exercisesService.findAllTags();
  }

  @Get()
  findAll(@Query() findAllExercisesDto: FindAllExercisesDto) {
    return this.exercisesService.findAll(findAllExercisesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Exercise & { views: number }> {
    return this.exercisesService.findOne(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image1', maxCount: 1 },
      { name: 'image2', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  async uploadExercise(
    @UploadedFiles()
    files: {
      image1?: Express.Multer.File[];
      image2?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
    @Body() createExerciseDto: CreateExerciseDto,
  ) {
    const imageFile1 = files.image1?.[0];
    const imageFile2 = files.image2?.[0];
    const videoFile = files.video?.[0];

    if (typeof createExerciseDto.tags === 'string') {
      try {
        createExerciseDto.tags = JSON.parse(createExerciseDto.tags);
      } catch (error) {
        throw new BadRequestException('Invalid tags format.');
      }
    }

    if (!imageFile1 || !imageFile2 || !videoFile) {
      throw new BadRequestException(
        'Se requieren tanto una imagen como un video.',
      );
    }

    return this.exercisesService.createExercise(
      createExerciseDto,
      imageFile1,
      imageFile2,
      videoFile,
    );
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image1', maxCount: 1 },
      { name: 'image2', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: number,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @UploadedFiles()
    files?: {
      image1?: Express.Multer.File[];
      image2?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
  ) {
    const imageFile1 = files?.image1?.[0];
    const imageFile2 = files?.image2?.[0];
    const videoFile = files?.video?.[0];

    if (typeof updateExerciseDto.tags === 'string') {
      try {
        updateExerciseDto.tags = JSON.parse(updateExerciseDto.tags);
      } catch (error) {
        throw new BadRequestException('Invalid tags format.');
      }
    }
    return this.exercisesService.update(
      id,
      updateExerciseDto,
      imageFile1,
      imageFile2,
      videoFile,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.exercisesService.delete(id);
  }

  @Post('find-similar')
  async findSimilar(@Body() body: { latex: string; tags?: string[] }): Promise<{
    exactMatch: ExerciseWithMatchingTags | null;
    similarMatches: (ExerciseWithMatchingTags & { score: number })[];
  }> {
    // if (!body.latex) {
    //   throw new BadRequestException('El campo "latex" es requerido.');
    // }
    return this.exercisesService.findSimilar(body.latex, body.tags);
  }

  @Post('find-similar-by-image')
  @UseInterceptors(FileInterceptor('image'))
  async findSimilarByImage(
    @UploadedFile() image: Express.Multer.File,
  ): Promise<{
    exactMatch: ExerciseWithMatchingTags | null;
    similarMatches: (ExerciseWithMatchingTags & { score: number })[];
  }> {
    if (!image) {
      throw new BadRequestException('Se requiere una imagen.');
    }
    return this.exercisesService.findSimilarByImage(image);
  }
  @Post('extract-latex')
  @UseInterceptors(FileInterceptor('image'))
  async extractLatex(@UploadedFile() image: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('Se requiere una imagen.');
    }
    return this.exercisesService.extractLatexFromImage(image);
  }

  @Post('suggest-tags')
  @UseInterceptors(FileInterceptor('image'))
  async suggestTags(@UploadedFile() image: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('Se requiere una imagen.');
    }
    return this.exercisesService.suggestTags(image.buffer);
  }
}
