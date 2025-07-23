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
import { ExercisesService } from './exercises.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { FindAllExercisesDto } from './dto/find-all-exercises.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { Exercise } from './entities/exercise.entity';

@Controller('exercises')
@UseGuards(JwtAuthGuard) // Protegemos toda la ruta de ejercicios
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

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

    // Es una mejor práctica validar la presencia de archivos en el controlador.
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
  async findSimilar(@Body('latex') latex: string) {
    if (!latex) {
      throw new BadRequestException('El campo "latex" es requerido.');
    }
    return this.exercisesService.findSimilar(latex);
  }
  @Post('find-similar-by-image')
  @UseInterceptors(FileInterceptor('image'))
  async findSimilarByImage(@UploadedFile() image: Express.Multer.File) {
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
}
