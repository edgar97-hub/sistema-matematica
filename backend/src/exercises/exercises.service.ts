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
import { OpenaiService } from 'src/math-processing/openai/openai.service';
// import { fileType } from 'file-type';
import { fileTypeFromStream, fileTypeFromBuffer } from 'file-type';

export interface ExerciseWithMatchingTags extends Exercise {
  matchingTags?: string[];
}

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    private readonly fileStorageService: FileStorageService,
    private readonly simpleTexService: SimpleTexService,
    private readonly similarityService: SimilarityService,
    private readonly openaiService: OpenaiService,
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
      tags: createExerciseDto.tags,
    });

    // 5. Guardar en la base de datos y devolver
    return this.exerciseRepository.save(newExercise);
  }

  async findAll(findAllDto: FindAllExercisesDto) {
    const {
      page = 1,
      limit = 10,
      title,
      sortKey = 'createdAt',
      sortOrder = 'DESC',
    } = findAllDto;
    const queryBuilder = this.exerciseRepository
      .createQueryBuilder('exercise')
      .leftJoinAndSelect('exercise.orders', 'orders');
    if (title) {
      queryBuilder.where('exercise.title LIKE :title', {
        title: `%${title}%`,
      });
    }

    queryBuilder
      .orderBy(`exercise.${sortKey}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    // console.log('data', data);
    // const exercisesWithViewCount = await Promise.all(
    //   data.map(async (exercise) => {
    //     const viewCount = await this.exerciseRepository
    //       .createQueryBuilder('exercise')
    //       .leftJoin('exercise.orders', 'orders')
    //       // .where('exercise.id = :exerciseId', { exerciseId: exercise.id })
    //       // .andWhere(
    //       //   'orders.enunciadoLatexOriginal = exercise.enunciadoLatexOriginal',
    //       // )
    //       .getCount();
    //     return { ...exercise, views: viewCount };
    //   }),
    // );

    const exercisesWithViewCount = data.map((exercise) => ({
      ...exercise,
      views: exercise.orders.length,
    }));

    // console.log('exercisesWithViewCount', exercisesWithViewCount);
    return {
      data: exercisesWithViewCount,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Exercise & { views: number }> {
    const exercise = await this.exerciseRepository.findOneBy({ id });
    if (!exercise) {
      throw new NotFoundException(`Ejercicio con ID "${id}" no encontrado.`);
    }

    const viewCount = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .innerJoin('exercise.orders', 'orders')
      .where('exercise.id = :exerciseId', { exerciseId: exercise.id })
      // .andWhere(
      //   'order.enunciadoLatexOriginal = exercise.enunciadoLatexOriginal',
      // )
      .getCount();
    // console.log('viewCount', exercise);
    // console.log('exercise', viewCount);
    return { ...exercise, views: viewCount };
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

    // if (updateExerciseDto.tags) {
    //   // exercise.tags = updateExerciseDto.tags;
    // }

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

  async findSimilar(
    latex: string,
    tags: string[] = [],
    threshold = 0.4,
  ): Promise<{
    exactMatch: ExerciseWithMatchingTags | null;
    similarMatches: (ExerciseWithMatchingTags & { score: number })[];
  }> {
    // Búsqueda Exacta
    let exactMatch = await this.exerciseRepository.findOne({
      where: { enunciadoLatexOriginal: latex },
    });

    // Calculate matchingTags for exactMatch if it exists
    if (exactMatch) {
      const userTagsSet = new Set(tags?.map((tag) => tag.toLowerCase()));
      const exactMatchTagsSet = new Set(
        exactMatch.tags?.map((tag) => tag.toLowerCase()),
      );
      const exactMatchingTags = [...userTagsSet].filter((tag) =>
        exactMatchTagsSet.has(tag),
      );
      exactMatch = {
        ...exactMatch,
        matchingTags: exactMatchingTags,
      } as ExerciseWithMatchingTags;
    }

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

    const similarMatches: (ExerciseWithMatchingTags & {
      score: number;
    })[] = [];

    for (const exercise of allExercises) {
      if (exercise.ngrams) {
        const dbNgrams = new Set(JSON.parse(exercise.ngrams) as string[]);
        const latexScore = this.similarityService.jaccardSimilarity(
          inputNgrams,
          dbNgrams,
        );

        const userTags = new Set(tags?.map((tag) => tag.toLowerCase()));
        const exerciseTags = new Set(
          exercise.tags?.map((tag) => tag.toLowerCase()),
        );
        const matchingTags = [...userTags].filter((tag) =>
          exerciseTags.has(tag),
        );

        const tagScore = this.similarityService.jaccardSimilarity(
          userTags,
          exerciseTags,
        );

        // Combine scores (e.g., weighted average)
        let score = 0;
        if (latex) {
          console.log("test1")
          score = 0.9 * latexScore + 0.9 * tagScore;
        } else {
          console.log('test2');
          score = 0.7 * tagScore;
        }

        if (score >= threshold) {
          similarMatches.push({
            ...exercise,
            score,
            matchingTags,
          });
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

  async suggestTags(imageBuffer: Buffer): Promise<string[]> {
    return this.openaiService.suggestTagsFromImage(imageBuffer);
  }

  async findAllTags(): Promise<string[]> {
    const exercises = await this.exerciseRepository.find();
    const allTags = exercises.flatMap((exercise) => exercise.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags;
  }
}
