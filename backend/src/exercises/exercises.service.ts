import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { FindAllExercisesDto } from './dto/find-all-exercises.dto';
import { FileStorageService } from 'src/file-storage/file-storage/file-storage.service';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async createExercise(
    createExerciseDto: CreateExerciseDto,
    imageFile1: Express.Multer.File,
    imageFile2: Express.Multer.File,
    videoFile: Express.Multer.File,
  ): Promise<Exercise> {
    // 1. Usar FileStorageService para guardar los archivos en carpetas separadas
    const imageUploadResult1 = await this.fileStorageService.uploadFile(
      imageFile1,
      '/exercises/images',
    );
    const imageUploadResult2 = await this.fileStorageService.uploadFile(
      imageFile2,
      '/exercises/images',
    );
    const videoUploadResult = await this.fileStorageService.uploadFile(
      videoFile,
      '/exercises/videos',
    );

    // 2. Crear la entidad con las URLs relativas devueltas por el servicio
    const newExercise = this.exerciseRepository.create({
      ...createExerciseDto,
      imageUrl1: imageUploadResult1.url,
      imageUrl2: imageUploadResult2.url,
      videoUrl: videoUploadResult.url,
    });

    // 3. Guardar en la base de datos y devolver
    return this.exerciseRepository.save(newExercise);
  }

  async findAll(findAllDto: FindAllExercisesDto) {
    const { page = 1, limit = 10, title } = findAllDto;
    const queryBuilder = this.exerciseRepository.createQueryBuilder('exercise');

    if (title) {
      queryBuilder.where('exercise.title LIKE :title', {
        title: `%${title}%`,
      });
    }

    queryBuilder
      .orderBy('exercise.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Exercise> {
    const exercise = await this.exerciseRepository.findOneBy({ id });
    if (!exercise) {
      throw new NotFoundException(`Ejercicio con ID "${id}" no encontrado.`);
    }
    return exercise;
  }

  async update(
    id: number,
    updateExerciseDto: UpdateExerciseDto,
    imageFile1?: Express.Multer.File,
    imageFile2?: Express.Multer.File,
    videoFile?: Express.Multer.File,
  ): Promise<Exercise> {
    const exercise = await this.findOne(id);

    if (exercise.imageUrl1) {
      await this.fileStorageService.deleteFile(exercise.imageUrl1);
      exercise.imageUrl1 = '';
    }

    if (imageFile1) {
      const imageUploadResult = await this.fileStorageService.uploadFile(
        imageFile1,
        '/exercises/images',
      );
      exercise.imageUrl1 = imageUploadResult.url;
    }

    if (exercise.imageUrl2) {
      await this.fileStorageService.deleteFile(exercise.imageUrl2);
      exercise.imageUrl2 = '';
    }

    if (imageFile2) {
      const imageUploadResult = await this.fileStorageService.uploadFile(
        imageFile2,
        '/exercises/images',
      );
      exercise.imageUrl2 = imageUploadResult.url;
    }

    if (exercise.videoUrl) {
      await this.fileStorageService.deleteFile(exercise.videoUrl);
      exercise.videoUrl = '';
    }
    if (videoFile) {
      const videoUploadResult = await this.fileStorageService.uploadFile(
        videoFile,
        '/exercises/videos',
      );
      exercise.videoUrl = videoUploadResult.url;
    }

    // Update other fields from DTO
    Object.assign(exercise, updateExerciseDto);
    return this.exerciseRepository.save(exercise);
  }

  async delete(id: number): Promise<null> {
    const exercise = await this.findOne(id);

    if (exercise.imageUrl1) {
      await this.fileStorageService.deleteFile(exercise.imageUrl1);
    }

    if (exercise.imageUrl2) {
      await this.fileStorageService.deleteFile(exercise.imageUrl2);
    }

    if (exercise.videoUrl) {
      await this.fileStorageService.deleteFile(exercise.videoUrl);
    }
    this.exerciseRepository.delete(id);
    return null;
  }
}
