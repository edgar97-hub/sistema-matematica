import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  FindOptionsWhere,
  ILike,
  FindOneOptions,
} from 'typeorm';
import { OrderEntity } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsersService } from '../users/users/users.service';
import { FileStorageService } from '../file-storage/file-storage/file-storage.service';
import { OrderPipelineStatus } from './enums/order-pipeline-status.enum';
import { CreditService } from '../credit-system/services/credit.service';
import { Express } from 'express';
import { FilterOrderDto } from './dto/filter-order.dto';
import { SortOrderDto } from './dto/sort-order.dto';
import { SystemConfigurationService } from '../system-configuration/services/system-configuration.service';
import { OpenaiService } from '../math-processing/openai/openai.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { CreditTransactionAction } from 'src/credit-system/entities/credit-transaction.entity';
import { SimpleTexService } from '../math-processing/services/simpletex.service';
import {
  SimpleTexError,
  SimpleTexResponse,
} from '../math-processing/interfaces/simpletex-response.interface';
import { join, parse, basename } from 'path';
import * as fs from 'fs';
import { AudioService } from 'src/math-processing/services/audio.service';
import { ManimService } from 'src/math-processing/manim/manim.service';
import { FFmpegService } from 'src/math-processing/services/ffmpeg.service';
import { PaginatedResponse, PaginationDto } from './dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly usersService: UsersService,
    private readonly fileStorageService: FileStorageService,
    // private readonly audioService: AudioService,
    // private readonly ffmpegService: FFmpegService,
    private readonly manimService: ManimService,

    private readonly simpleTexService: SimpleTexService,
    private readonly openaiService: OpenaiService,
    private readonly systemConfigurationService: SystemConfigurationService,
    private readonly entityManager: EntityManager,
  ) {}

  async createOrder(
    userId: number,
    createOrderDto: CreateOrderDto,
    imageFile: Express.Multer.File,
  ): Promise<OrderEntity> {
    let savedOrder: OrderEntity | undefined = undefined;

    // No hay transacción de BD aquí para la deducción de créditos todavía.
    // La transacción de créditos ocurrirá DESPUÉS del OCR exitoso.

    try {
      // 1. Subir imagen (puede ir antes o después de crear la entidad inicial)
      const uploadResult = await this.fileStorageService.uploadFile(
        imageFile,
        `orders/images/${userId}`,
      );
      if (!uploadResult || !uploadResult.url) {
        console.error(
          `Fallo al subir la imagen para el usuario ${userId}`,
          '',
          'OrdersService_CreateOrder',
        );
        throw new InternalServerErrorException(
          'Fallo al procesar la imagen del problema.',
        );
      }
      console.log(
        `Imagen subida a: ${uploadResult.url} para usuario ${userId}`,
        'OrdersService_CreateOrder',
      );

      // 2. Generar el siguiente 'code' para la orden
      // (Esta lógica debe ser robusta, considera una secuencia o un método dedicado)
      // const lastOrder = await this.entityManager.findOne(OrderEntity, {
      //   order: { code: 'DESC' },
      //   where: {},
      //   select: ['code'],
      // });
      // const nextCode = (lastOrder && lastOrder.code ? lastOrder.code : 0) + 1;

      // 3. Crear y guardar la entidad Order con estado inicial
      const newOrderData: Partial<OrderEntity> = {
        ...createOrderDto,
        userId,
        originalImageUrl: uploadResult.url,
        status: OrderPipelineStatus.OCR_PENDING, // Nuevo estado: listo para OCR
        creditsConsumed: 1, // Definimos que consumirá 1, pero aún no se ha deducido
      };
      // Usamos el repositorio directamente aquí si no hay otras ops de BD en este punto.
      // Si la creación del código también necesitara transacción, envuelve esto.
      savedOrder = await this.entityManager
        .getRepository(OrderEntity)
        .save(
          this.entityManager.getRepository(OrderEntity).create(newOrderData),
        );
      console.log(
        `Orden ${savedOrder.id}  creada, estado: ${savedOrder.status}`,
        'OrdersService_CreateOrder',
      );

      // 4. Disparar el pipeline de IA de forma asíncrona
      this.processOrderPipeline(savedOrder.id).catch((pipelineError) => {
        console.error(
          `Error en el pipeline asíncrono para la orden ${savedOrder?.id}: ${pipelineError.message}`,
          pipelineError.stack,
          'OrdersService_CreateOrder_PipelineCatch',
        );
        // No actualizamos la orden aquí directamente, processOrderPipeline debe manejar sus propios estados de error.
      });

      return savedOrder;
    } catch (error) {
      console.error(
        `Error en createOrder para usuario ${userId}: ${error.message}`,
        error.stack,
        'OrdersService_CreateOrder',
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al crear la orden.',
      );
    }
  }

  private async processOrderPipeline(orderId: number): Promise<void> {
    console.log(
      `Pipeline: Iniciando para orden ${orderId}`,
      'OrdersService_Pipeline',
    );
    let order: OrderEntity | null = null;

    try {
      order = await this.entityManager.findOne(OrderEntity, {
        where: { id: orderId },
      });
      if (!order) {
        console.error(
          `Pipeline: Orden ${orderId} no encontrada para procesar.`,
          '',
          'OrdersService_Pipeline',
        );
        return;
      }

      // --- 1. OCR con Mathpix ---
      console.log('--- 1. OCR con Mathpix ---');
      console.log(
        `Pipeline: Iniciando OCR para orden ${order.id} (Estado actual: ${order.status})`,
        'OrdersService_Pipeline',
      );
      if (
        order.status !== OrderPipelineStatus.OCR_PENDING &&
        order.status !== OrderPipelineStatus.PENDING
      ) {
        // Permite reintentar desde PENDING
        console.warn(
          `Pipeline: Orden ${order.id} no está en estado OCR_PENDING o PENDING. Estado actual: ${order.status}. Omitiendo OCR.`,
          '',
          'OrdersService_Pipeline',
        );
      } else {
        await this.entityManager.update(OrderEntity, order.id, {
          status: OrderPipelineStatus.PROCESSING_OCR,
        });
        order.status = OrderPipelineStatus.PROCESSING_OCR; // Actualizar estado local
        console.log(
          `Pipeline: Orden ${order.id} actualizada a PROCESSING_OCR`,
          'OrdersService_Pipeline',
        );

        // Llamada al nuevo servicio
        let imageBuffer: Buffer;
        try {
          // order.originalImageUrl es la ruta RELATIVA desde la carpeta 'uploads'
          // Ej: "orders/images/4/imagen.png"
          imageBuffer = await this.fileStorageService.readFileToBuffer(
            order.originalImageUrl,
          );
        } catch (readError: any) {
          console.error(
            `Pipeline: No se pudo leer el archivo de imagen local ${order.originalImageUrl} para orden ${order.id}`,
            readError.stack,
            'OrdersService_Pipeline',
          );
          await this.entityManager.update(OrderEntity, order.id, {
            status: OrderPipelineStatus.OCR_FAILED,
            errorMessage:
              'Error interno al acceder a la imagen para OCR: ' +
              readError.message,
          });
          return;
        }

        // Obtener el nombre de archivo original de la ruta (SimpleTex lo podría usar para el nombre en respuestas de batch, aunque aquí es single)
        const originalFilename = parse(order.originalImageUrl).base;

        const simpleTexResponse =
          await this.simpleTexService.extractMathFromImageBuffer(
            imageBuffer,
            originalFilename,
          );
        const extractedMathText = simpleTexResponse.res?.latex;
        console.log('extractedMathText', extractedMathText);
        if (
          !simpleTexResponse.status ||
          !extractedMathText ||
          extractedMathText.trim() === '' ||
          extractedMathText === '[EMPTY]' ||
          extractedMathText === '[DOCIMG]'
        ) {
          await this.entityManager.update(OrderEntity, order.id, {
            status: OrderPipelineStatus.OCR_FAILED,
            errorMessage:
              simpleTexResponse.status +
              ' SimpleTex OCR no devolvió texto extraído.',
            mathpixExtraction: JSON.stringify(simpleTexResponse),
          });
          return;
        }

        // OCR Exitoso, actualizamos la orden con el texto y el estado para deducir crédito
        console.log(
          'OCR Exitoso, actualizamos la orden con el texto y el estado para deducir crédito',
        );
        await this.entityManager.update(OrderEntity, order.id, {
          mathpixExtraction: extractedMathText,
          status: OrderPipelineStatus.OCR_SUCCESSFUL_CREDIT_PENDING,
        });
        order.mathpixExtraction = extractedMathText; // Actualizar estado local
        order.status = OrderPipelineStatus.OCR_SUCCESSFUL_CREDIT_PENDING;
        console.log(
          `Pipeline: OCR completado para orden ${order.id}. Estado: ${order.status}`,
          'OrdersService_Pipeline',
        );
      }

      // --- 2. Deducir Créditos (TRANSACCIONAL) ---
      // Este paso solo se ejecuta si el OCR fue exitoso y el estado es el correcto
      console.log('--- 2. Deducir Créditos (TRANSACCIONAL) ---');
      if (order.status === OrderPipelineStatus.OCR_SUCCESSFUL_CREDIT_PENDING) {
        console.log(
          `Pipeline: Intentando deducir créditos para orden ${order.id}`,
          'OrdersService_Pipeline',
        );
        try {
          // Para este paso a paso, vamos a iniciar una transacción aquí para la deducción Y la actualización de la orden.
          await this.entityManager.transaction(async (tem) => {
            const orderInTransaction = await tem.findOneOrFail(OrderEntity, {
              where: { id: order!.id },
            });
            const userInTransaction = await tem.findOneOrFail(UserEntity, {
              where: { id: orderInTransaction.userId },
            });

            const creditsToConsume = orderInTransaction.creditsConsumed || 1;

            if (userInTransaction.creditBalance < creditsToConsume) {
              throw new BadRequestException(
                'Créditos insuficientes al momento de la deducción.',
              );
            }

            const balanceBefore = userInTransaction.creditBalance;
            userInTransaction.creditBalance -= creditsToConsume;
            const balanceAfter = userInTransaction.creditBalance;

            await tem.save(UserEntity, userInTransaction); // Guardar usuario actualizado

            // Registrar la transacción de crédito
            await this.usersService.internalRecordTransaction(
              {
                targetUserId: userInTransaction.id,
                action: CreditTransactionAction.USAGE_RESOLUTION,
                amount: -Math.abs(creditsToConsume),
                balanceBefore,
                balanceAfter,
                reason: `Resolución Orden ${orderInTransaction.id}`,
                // orderId: orderInTransaction.id, // Si tienes este campo en CreditTransactionEntity
              },
              tem, // Pasar el transactional entity manager
            );

            // Actualizar la orden
            orderInTransaction.status = OrderPipelineStatus.AI_SOLUTION_PENDING; // Siguiente estado
            await tem.save(OrderEntity, orderInTransaction);
            order = orderInTransaction; // Actualiza la referencia de la orden principal
            console.log(
              `Pipeline: Créditos deducidos y orden ${order.id} actualizada a AI_SOLUTION_PENDING`,
              'OrdersService_Pipeline',
            );
          });
        } catch (deductionError: any) {
          console.error(
            `Pipeline: Fallo al deducir créditos para orden ${order.id}: ${deductionError.message}`,
            deductionError.stack,
            'OrdersService_Pipeline',
          );
          await this.entityManager.update(OrderEntity, order.id, {
            status: OrderPipelineStatus.CREDIT_DEDUCTION_FAILED,
            errorMessage:
              deductionError.message || 'Fallo al deducir créditos.',
          });
          return; // Termina el pipeline aquí
        }
      }

      // --- 3. Generación de Solución con OpenAI ---
      console.log('--- 3. Generación de Solución con OpenAI ---');
      if (order.status === OrderPipelineStatus.AI_SOLUTION_PENDING) {
        console.log(
          `Pipeline: Iniciando generación de solución IA para ${order.id}`,
          'OrdersService_Pipeline',
        );
        const config = await this.systemConfigurationService.getConfiguration();
        // console.log(
        //   'config, config.openAiPromptBase',
        //   config,
        //   config.openAiPromptBase,
        // );
        // if (!config || !config.openAiPromptBase) {
        //   throw new Error(
        //     'Configuración de prompt base de OpenAI no encontrada.',
        //   );
        // }
        const solutionJson =
          await this.openaiService.generateStepByStepSolution(
            order.mathpixExtraction!,
            config.openAiPromptBase,
            order.countrySelected,
            order.educationalStageSelected,
            order.subdivisionGradeSelected,
          );
        await this.entityManager.update(OrderEntity, order.id, {
          openAiSolution: solutionJson,
          status: OrderPipelineStatus.GENERATING_VIDEO_PENDING,
        });
        order.openAiSolution = solutionJson;
        order.status = OrderPipelineStatus.GENERATING_VIDEO_PENDING;
        console.log(`Pipeline: Solución IA generada para ${order.id}`);
        // console.log('solutionJson', solutionJson);
      }

      // --- 4. Generación del Video Final Sincronizado ---
      if (order.status === OrderPipelineStatus.GENERATING_VIDEO_PENDING) {
        console.log(
          `Solicitando video final al microservicio Manim para orden ${order.id}`,
          'OrdersService_Pipeline',
        );
        const solution = order.openAiSolution as any;

        if (!solution || !solution.steps || solution.steps.length === 0) {
          throw new Error(
            'La solución de IA no es válida para generar el video.',
          );
        }

        // LLAMAR AL MICROSERVICIO MANIM UNA SOLA VEZ
        const manimResult = await this.manimService.renderFullVoiceoverVideo({
          orderId: order.id.toString(),
          solutionJson: solution,
        });
        console.log('manimResult', manimResult);
        if (manimResult.error || !manimResult.localPath) {
          throw new Error(
            `Fallo en el microservicio Manim: ${manimResult.error}`,
          );
        }

        // El microservicio ya nos dio el video final.
        const finalVideoPath = manimResult.localPath;
        console.log(
          `Video final completo recibido en: ${finalVideoPath}`,
          'OrdersService_Pipeline',
        );

        // Construir la URL pública
        const finalVideoPublicUrl = `/final_videos/${basename(finalVideoPath)}`;

        // --- 5. Completado Final ---
        await this.entityManager.update(OrderEntity, order.id, {
          finalVideoUrl: finalVideoPublicUrl,
          status: OrderPipelineStatus.COMPLETED,
          completedAt: new Date(),
        });
        console.log(
          `¡COMPLETADO! Video final para orden ${order.id} en ${finalVideoPublicUrl}`,
          'OrdersService_Pipeline',
        );

        // --- 6. Limpieza ---
        // Limpiar el video final del directorio temporal de NestJS después de un tiempo,
        // o moverlo a un almacenamiento permanente. Por ahora, lo dejamos.
      }

      // const all_audio_paths: string[] = [];
      // const all_video_paths: string[] = [];

      // // --- 4. Generación y Renderizado por Segmentos ---
      // console.log('--- 4. Generación y Renderizado por Segmentos ---');
      // if (order.status === OrderPipelineStatus.GENERATING_AUDIO_PENDING) {
      //   const solution = order.openAiSolution as any;
      //   const steps = solution.steps || [];

      //   if (steps.length === 0) {
      //     throw new Error('La solución de IA no contiene pasos.');
      //   }

      //   const audioPaths: string[] = [];
      //   const videoPaths: string[] = [];

      //   // Bucle para procesar cada paso individualmente
      //   for (const step of steps) {
      //     const stepDescription =
      //       step.stepNumber === 'Final'
      //         ? `${step.description}`
      //         : `Paso ${step.stepNumber}: ${step.description}`;
      //     const stepFormula = step.formula || '';

      //     // A. Generar Audio para el segmento
      //     const { audioBuffer, fileExtension } =
      //       await this.openaiService.generateAudioNarrationBuffer(
      //         stepDescription,
      //       );
      //     const audioSaveResult = await this.fileStorageService.uploadBuffer(
      //       audioBuffer,
      //       `temp/${order.id}`,
      //       `audio_step_${step.stepNumber}.${fileExtension}`,
      //     );
      //     audioPaths.push(audioSaveResult.filePath);
      //     console.log(
      //       `Audio para paso ${step.stepNumber} generado en: ${audioSaveResult.filePath}`,
      //       'OrdersService_Pipeline',
      //     );

      //     // B. Medir la Duración del Audio (CRÍTICO PARA LA SINCRONIZACIÓN)
      //     const audioDuration =
      //       await this.audioService.getAudioDuration(audioBuffer);
      //     if (audioDuration === 0) {
      //       console.warn(
      //         `No se pudo determinar la duración del audio para el paso ${step.stepNumber}. Usando fallback.`,
      //         'OrdersService_Pipeline',
      //       );
      //     }

      //     // C. Generar el Video para el segmento con la duración del audio
      //     const manimResult = await this.manimService.renderSegment({
      //       // Este es el método que llama a /render-segment en el microservicio
      //       segmentId: `order_${order.id}_step_${step.stepNumber}`,
      //       description: stepDescription,
      //       formula: stepFormula,
      //       duration: audioDuration > 0 ? audioDuration : 3.0, // Usar duración medida o un fallback de 3s
      //     });

      //     if (manimResult.error || !manimResult.localPath) {
      //       throw new Error(
      //         `Fallo en el microservicio Manim para el paso ${step.stepNumber}: ${manimResult.error}`,
      //       );
      //     }
      //     videoPaths.push(manimResult.localPath);
      //     console.log(
      //       `Video para paso ${step.stepNumber} generado en: ${manimResult.localPath}`,
      //       'OrdersService_Pipeline',
      //     );
      //   }

      //   // D. Actualizar estado en la orden
      //   await this.entityManager.update(OrderEntity, order.id, {
      //     status: OrderPipelineStatus.ASSEMBLING_FINAL_PENDING,
      //   });
      //   order.status = OrderPipelineStatus.ASSEMBLING_FINAL_PENDING;
      //   console.log(
      //     `Pipeline: Todos los segmentos generados para orden ${order.id}. Siguiente estado: ${order.status}`,
      //     'OrdersService_Pipeline',
      //   );
      // }

      // // --- 5. Ensamblaje Final con FFmpeg ---
      // console.log('--- 5. Ensamblaje Final con FFmpeg ---');
      // if (order.status === OrderPipelineStatus.ASSEMBLING_FINAL_PENDING) {
      //   if (all_audio_paths.length === 0 || all_video_paths.length === 0) {
      //     throw new Error(
      //       'No se generaron segmentos de audio/video para ensamblar.',
      //     );
      //   }

      //   // Llamar a FFmpegService con las listas de archivos
      //   console.log(
      //     `Pipeline: Iniciando ensamblaje final para orden ${order.id}`,
      //     'OrdersService_Pipeline',
      //   );
      //   const ffmpegResult = await this.ffmpegService.concatenateAndCombine(
      //     all_video_paths,
      //     all_audio_paths,
      //     order.id.toString(),
      //   );

      //   // --- 6. Completado Final ---
      //   await this.entityManager.update(OrderEntity, order.id, {
      //     finalVideoUrl: ffmpegResult.finalVideoPublicUrl, // La URL relativa/pública
      //     status: OrderPipelineStatus.COMPLETED,
      //     completedAt: new Date(),
      //   });
      //   order.status = OrderPipelineStatus.COMPLETED;
      //   console.log(
      //     `Pipeline: ¡COMPLETADO! Video final para orden ${order.id} en ${ffmpegResult.finalVideoPublicUrl}`,
      //     'OrdersService_Pipeline',
      //   );

      //   // --- 7. Limpieza de Archivos Temporales ---
      //   console.log(
      //     `
      //     --- 7. Limpieza de Archivos Temporales ---
      //     Iniciando limpieza de archivos temporales para orden ${order.id}`,
      //     'OrdersService_Pipeline',
      //   );
      //   for (const path of [...all_audio_paths, ...all_video_paths]) {
      //     try {
      //       // await fs.promises.unlink(path);
      //     } catch (e) {
      //       console.warn(
      //         `No se pudo eliminar el archivo temporal: ${path}`,
      //         e.stack,
      //         'OrdersService_Pipeline',
      //       );
      //     }
      //   }

      //   // También limpiar el directorio temporal de Manim si es posible
      //   const manimTempDir = join(
      //     process.cwd(),
      //     'temp_manim_processing',
      //     `order_${order.id}_*`,
      //   ); // Esto necesita una lógica más robusta
      //   //  fs.remove(manimTempDir)
      // }
    } catch (pipelineError: any) {
      // Catch general para errores inesperados en el flujo de pipeline
      console.error(
        `Pipeline: Error procesando orden ${orderId}: ${pipelineError.message}`,
        pipelineError.stack,
        'OrdersService_Pipeline',
      );
      let finalErrorStatus = OrderPipelineStatus.FAILED_GENERAL;
      // Determinar un estado de error más específico si es posible basado en el error
      if (order && order.id) {
        // Podrías querer obtener el estado actual de la orden de la BD antes de actualizar
        const currentOrderInDb = await this.entityManager.findOne(OrderEntity, {
          where: { id: order.id },
        });
        if (
          currentOrderInDb &&
          !currentOrderInDb.status.endsWith('FAILED') &&
          currentOrderInDb.status !== OrderPipelineStatus.COMPLETED
        ) {
          if (pipelineError.message?.includes('OpenAI TTS'))
            finalErrorStatus = OrderPipelineStatus.AUDIO_FAILED;
          // Añade más lógica para otros estados de error
          await this.entityManager.update(OrderEntity, order.id, {
            status: finalErrorStatus,
            errorMessage: `Error en pipeline (estado anterior: ${order.status}): ${pipelineError.message}`,
          });
        }
      }
    }
  }

  // async findUserOrders(
  //   userId: number,
  //   page: number = 1,
  //   limit: number = 10,
  // ): Promise<{ data: OrderEntity[]; total: number }> {
  //   const [data, total] = await this.orderRepository.findAndCount({
  //     where: { userId },
  //     order: { createdAt: 'DESC' },
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   });

  //   return { data, total };
  // }

  // async updateOcrResult(
  //   orderId: number,
  //   extractionData: any,
  //   status: OrderPipelineStatus,
  //   error?: string | null,
  // ): Promise<void> {
  //   const order = await this.orderRepository.findOne({
  //     where: { id: orderId },
  //   });
  //   if (!order) {
  //     console.error(`Order with ID "${orderId}" not found`);
  //     return;
  //   }

  //   order.mathpixExtraction = extractionData;
  //   order.status = status;
  //   // order.errorMessage = error || null;

  //   await this.orderRepository.save(order);
  // }

  // private async processOcr(
  //   orderId: number,
  //   imageUrl: string,
  //   country?: string,
  //   stage?: string,
  //   subdivision?: string,
  // ): Promise<void> {
  //   try {
  //     const mathpixExtraction =
  //       await this.mathpixService.extractTextFromImageUrl(imageUrl);

  //     if (!mathpixExtraction) {
  //       console.error(
  //         `Mathpix failed for order ${orderId}:`,
  //         'mathpixExtraction.error',
  //       );
  //       await this.updateOcrResult(
  //         orderId,
  //         null,
  //         OrderPipelineStatus.OCR_FAILED,
  //         'mathpixExtraction.error',
  //       );
  //     } else {
  //       try {
  //         const systemConfiguration =
  //           await this.systemConfigurationService.getConfiguration();
  //         const promptBase = systemConfiguration.openAiPromptBase;

  //         // mathpixExtraction.text
  //         const openAiSolution =
  //           await this.openaiService.generateStepByStepSolution(
  //             'mathpixExtraction.text',
  //             promptBase,
  //             country,
  //             stage,
  //             subdivision,
  //           );

  //         await this.updateOrderDetails(orderId, {
  //           openAiSolution: openAiSolution,
  //           status: OrderPipelineStatus.AI_SOLUTION_PENDING,
  //         });
  //       } catch (openaiError) {
  //         console.error(`OpenAI failed for order ${orderId}:`, openaiError);
  //         await this.updateOrderDetails(orderId, {
  //           status: OrderPipelineStatus.AI_SOLUTION_FAILED,
  //           errorMessage: openaiError.message,
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error(`Error processing OCR for order ${orderId}:`, error);
  //     await this.updateOcrResult(
  //       orderId,
  //       null,
  //       OrderPipelineStatus.OCR_FAILED,
  //       error.message,
  //     );
  //   }
  // }

  async findAllOrders(
    page: number = 1,
    limit: number = 10,
    filters?: FilterOrderDto,
    sort?: SortOrderDto,
  ): Promise<{ data: OrderEntity[]; total: number }> {
    const where: FindOptionsWhere<OrderEntity> = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.startDate) {
      // where.createdAt = ILike(`%${filters.startDate }%`) ; // Adjust as needed for date range
    }
    if (filters?.endDate) {
      // where.createdAt = ILike(`%${filters.endDate}%`); // Adjust as needed for date range
    }

    const order: { [key: string]: 'ASC' | 'DESC' } = {};
    if (sort?.field && sort?.direction) {
      order[sort.field] = sort.direction;
    } else {
      order.createdAt = 'DESC';
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOrderByIdForAdmin(orderId: string): Promise<OrderEntity | null> {
    const order = await this.orderRepository.findOne({
      where: { id: parseInt(orderId) },
    });

    return order;
  }

  async updateOrderStatusByAdmin(
    orderId: string,
    newStatus: OrderPipelineStatus,
    adminNotes?: string,
  ): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: parseInt(orderId) },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    order.status = newStatus;
    // TODO: Implement adminNotes logging or storage if needed
    await this.orderRepository.save(order);

    return order;
  }

  /**
   * Busca las órdenes de un usuario específico de forma paginada.
   * @param userId ID del usuario autenticado.
   * @param paginationDto Objeto con los parámetros de paginación.
   * @returns Una promesa que resuelve a un objeto de respuesta paginada.
   */
  async findUserOrdersPaginated(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
      select: [
        // Seleccionar solo los campos necesarios para la lista
        'id',
        'topic',
        'educationalStageSelected',
        'subdivisionGradeSelected',
        'status',
        'finalVideoUrl',
        'createdAt',
      ],
    });

    const data: any[] = orders.map((order) => ({
      id: order.id,
      topic: order.topic,
      educationalStageSelected: order.educationalStageSelected,
      subdivisionGradeSelected: order.subdivisionGradeSelected,
      status: order.status,
      finalVideoUrl: order.finalVideoUrl,
      createdAt: order.createdAt.toISOString(),
    }));

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  // async updateOrderDetails(
  //   orderId: number,
  //   updates: Partial<OrderEntity>,
  // ): Promise<void> {
  //   try {
  //     await this.orderRepository.update(orderId, updates);
  //   } catch (error) {
  //     console.error(`Error updating order ${orderId}:`, error);
  //     throw new BadRequestException(`Failed to update order ${orderId}`);
  //   }
  // }

  async getFinalVideoPath(userId: number, orderId: number): Promise<string> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      select: ['id', 'userId', 'finalVideoUrl'],
    });

    if (!order) {
      throw new NotFoundException('La orden no existe.');
    }

    if (order.userId !== userId) {
      // Un usuario no debe poder descargar videos de otro
      throw new ForbiddenException(
        'No tienes permiso para acceder a este recurso.',
      );
    }

    if (!order.finalVideoUrl) {
      throw new NotFoundException(
        'El video para esta orden aún no está disponible o ha fallado.',
      );
    }

    // Construir la ruta absoluta en el sistema de archivos
    const filePath = join(process.cwd(), 'uploads', order.finalVideoUrl);
    return filePath;
  }

  async findOrderByIdForUser(
    orderId: string,
    userId: number,
  ): Promise<OrderEntity | null> {
    const order = await this.orderRepository.findOne({
      where: { id: parseInt(orderId), userId },
    });
    if (!order) {
      throw new NotFoundException('Orden no encontrada.');
    }
    return order;
  }
}
