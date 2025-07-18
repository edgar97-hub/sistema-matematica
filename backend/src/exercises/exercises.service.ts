import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { FindAllExercisesDto } from './dto/find-all-exercises.dto';
import { FileStorageService } from '../file-storage/file-storage/file-storage.service';
import { SimpleTexService } from '../math-processing/services/simpletex.service';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ParserService } from 'src/parser/parser.service';
import { SimilarityService } from 'src/similarity/similarity.service';
// import { fileType } from 'file-type';
import { fileTypeFromStream, fileTypeFromBuffer } from 'file-type';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    private readonly fileStorageService: FileStorageService,
    private readonly simpleTexService: SimpleTexService,
    private readonly similarityService: SimilarityService,
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

    // 2. Convertir la imagen de búsqueda a LaTeX
    const imageBuffer = await this.fileStorageService.readFileToBuffer(
      imageUploadResult1.url,
    );
    const simpleTexResponse =
      await this.simpleTexService.extractMathFromImageBuffer(imageBuffer);
    const latex = simpleTexResponse.res?.latex || '';

    const enunciadoLatexNormalizado =
      this.similarityService.normalizeLatex(latex);
    const ngrams = this.similarityService.generateNgrams(
      enunciadoLatexNormalizado,
    );

    // 4. Crear la entidad con las URLs relativas y los datos de LaTeX y AST
    const newExercise = this.exerciseRepository.create({
      ...createExerciseDto,
      imageUrl1: imageUploadResult1.url,
      imageUrl2: imageUploadResult2.url,
      videoUrl: videoUploadResult.url,
      enunciadoLatexOriginal: latex,
      enunciadoLatexNormalizado,
      ngrams: JSON.stringify(Array.from(ngrams)),
    });

    // 5. Guardar en la base de datos y devolver
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

    // 2. Convertir la imagen de búsqueda a LaTeX
    const imageBuffer = await this.fileStorageService.readFileToBuffer(
      exercise.imageUrl1,
    );
    const simpleTexResponse =
      await this.simpleTexService.extractMathFromImageBuffer(imageBuffer);
    updateExerciseDto.enunciadoLatexOriginal =
      simpleTexResponse.res?.latex || '';

    Object.assign(exercise, updateExerciseDto);

    if (updateExerciseDto.enunciadoLatexOriginal) {
      // 1. Obtener el LaTeX original del input.
      const latexOriginal = updateExerciseDto.enunciadoLatexOriginal;

      // 2. Normalizar el LaTeX.
      const latexNormalizado =
        this.similarityService.normalizeLatex(latexOriginal);

      // 3. Generar n-gramas DESDE LA VERSIÓN NORMALIZADA.
      const ngramsSet = this.similarityService.generateNgrams(latexNormalizado);

      // 4. Serializar los n-gramas para almacenamiento.
      const ngramsJson = JSON.stringify(Array.from(ngramsSet));

      // 5. Persistir todos los campos en la base de datos.
      exercise.enunciadoLatexOriginal = latexOriginal;
      exercise.enunciadoLatexNormalizado = latexNormalizado;
      exercise.ngrams = ngramsJson;
    }

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

  async findSimilar(latex: string, threshold = 0.4) {
    // Búsqueda Exacta
    const exactMatch = await this.exerciseRepository.findOne({
      where: { enunciadoLatexOriginal: latex },
    });

    // if (exactMatch) {
    //   return {
    //     exactMatch,
    //     similarMatches: [],
    //   };
    // }

    // Búsqueda por Similitud
    const normalizedInput = this.similarityService.normalizeLatex(latex);
    const inputNgrams = this.similarityService.generateNgrams(normalizedInput);

    let allExercises = await this.exerciseRepository.find();

    if (exactMatch) {
      allExercises = allExercises.filter(
        (item) =>
          item.enunciadoLatexOriginal !== exactMatch.enunciadoLatexOriginal,
      );
    }

    const similarMatches: { exercise: Exercise; score: number }[] = [];

    for (const exercise of allExercises) {
      if (exercise.ngrams) {
        const dbNgrams = new Set(JSON.parse(exercise.ngrams) as string[]);
        const score = this.similarityService.jaccardSimilarity(
          inputNgrams,
          dbNgrams,
        );

        if (score >= threshold) {
          similarMatches.push({ exercise, score });
        }
      }
    }

    similarMatches.sort((a, b) => b.score - a.score);

    return {
      exactMatch: exactMatch ?? null,
      similarMatches,
    };
  }
  async findSimilarByImage(imageFile: Express.Multer.File) {
    const simpleTexResponse =
      await this.simpleTexService.extractMathFromImageBuffer(imageFile.buffer);
    const latex = simpleTexResponse.res?.latex || '';

    if (!latex) {
      return {
        exactMatch: null,
        similarMatches: [],
      };
    }

    return this.findSimilar(latex);
  }
  async extractLatexFromImage(imageFile: Express.Multer.File) {
    const simpleTexResponse =
      await this.simpleTexService.extractMathFromImageBuffer(imageFile.buffer);
    return { latex: simpleTexResponse.res?.latex || '' };
  }
}
