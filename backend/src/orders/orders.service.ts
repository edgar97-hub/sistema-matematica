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
import { SimpleTexService } from 'src/math-processing/services/simpletex.service';
import {
  SimpleTexError,
  SimpleTexResponse,
} from '../math-processing/interfaces/simpletex-response.interface';
import { join, parse, basename } from 'path';
import * as fs from 'fs';
import { AudioService } from 'src/math-processing/services/audio.service';
import { PaginatedResponse, PaginationDto } from './dto/pagination.dto';
import { Exercise } from '../exercises/entities/exercise.entity';

export interface AdminOrderResponse extends OrderEntity {
  formatexUser: {
    id: number;
    name: string;
    email: string;
  };
  formatexExercise?: {
    id: number;
    title: string;
    imageUrl1: string;
  };
  matchType: 'Exacta' | 'Similar';
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly usersService: UsersService,
    private readonly fileStorageService: FileStorageService,
    private readonly creditService: CreditService,
    // private readonly audioService: AudioService,
    // private readonly ffmpegService: FFmpegService,

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
        `Pipeline: Iniciando OCR para orden ${order.id}
         (Estado actual: ${order.status})`,
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

      await this.entityManager.update(OrderEntity, order.id, {
        status: OrderPipelineStatus.COMPLETED,
        completedAt: new Date(),
      });
      console.log(
        `¡COMPLETADO! Video final para orden ${order.id} `,
        'OrdersService_Pipeline',
      );
    } catch (pipelineError: any) {
      // Catch general para errores inesperados en el flujo de pipeline
      console.error(
        `Pipeline: Error procesando orden ${orderId}: ${pipelineError.message}`,
        pipelineError.stack,
        'OrdersService_Pipeline',
      );
    }
  }

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

  async findAdminResolutionOrders(
    page: number = 1,
    limit: number = 10,
    filters?: { userName?: string; startDate?: string; endDate?: string },
  ): Promise<PaginatedResponse<AdminOrderResponse>> {
    // PaginatedResponse<AdminOrderResponse>
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      // .addSelect(['user.id', 'user.name', 'user.email'])
      .leftJoinAndSelect('order.exercise', 'exercise');
    // .addSelect(['exercise.id', 'exercise.title', 'exercise.imageUrl1']); // Select imageUrl1 from exercise

    if (filters?.userName) {
      queryBuilder.andWhere('user.name LIKE LOWER(:userName) ', {
        userName: `%${filters.userName}%`,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', {
        endDate: filters.endDate + 'T23:59:59.999Z', // Incluir todo el día
      });
    }

    queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const formattedData: AdminOrderResponse[] = data.map((order) => {
      const formatexUser = order.user
        ? { id: order.user.id, name: order.user.name, email: order.user.email }
        : { id: 0, name: 'Unknown', email: 'unknown@example.com' };

      const formatexExercise = order.exercise
        ? {
            id: order.exercise.id,
            title: order.exercise.title,
            imageUrl1: order.exercise.imageUrl1,
          }
        : undefined;

      return {
        ...order, // Spread all properties from OrderEntity
        formatexUser: formatexUser, // Use formatexUser as requested
        formatexExercise: formatexExercise, // Use formatexExercise as requested
        matchType: order.exercise ? 'Exacta' : 'Similar',
      };
    });

    return {
      data: formattedData,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
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
    paginationDto: PaginationDto & {
      filters?: FilterOrderDto;
      sort?: SortOrderDto;
    },
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, filters, sort } = paginationDto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<OrderEntity> = { userId };
    if (filters?.status) {
      where.status = filters.status;
    }

    const order: { [key: string]: 'ASC' | 'DESC' } = {};
    if (sort?.field && sort?.direction) {
      order[sort.field] = sort.direction;
    } else {
      order.createdAt = 'DESC';
    }
    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      order,
      take: limit,
      skip: skip,
      relations: ['exercise'],
      select: [
        'id',
        'topic',
        'status',
        'originalImageUrl',
        'finalVideoUrl',
        'createdAt',
      ],
    });

    const data: any[] = orders.map((order) => ({
      ...order,
      id: order.id,
      topic: order.topic,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      ejerciseImageUrl1: order.exercise?.imageUrl1 ?? '',
      ejerciseTitle: order.exercise?.title ?? '',
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

  async createOrderFromExercise(
    userId: number,
    exerciseId: number,
  ): Promise<OrderEntity> {
    return this.entityManager.transaction(async (tem) => {
      // 1. Check if the user has already acquired this exercise
      const existingOrder = await tem.findOne(OrderEntity, {
        where: {
          userId: userId,
          exercise: { id: exerciseId }, // Corrected: Query through the relation
          status: OrderPipelineStatus.COMPLETED, // Assuming COMPLETED means acquired
        },
      });

      if (existingOrder) {
        // If an existing order is found, return it without deducting credits
        // and indicate 0 credits consumed for this "re-acquisition"
        return { ...existingOrder, creditsConsumed: 0 };
      }

      const exercise = await tem.findOne(Exercise, {
        where: { id: exerciseId },
      });
      if (!exercise) {
        throw new NotFoundException(
          `Ejercicio con ID "${exerciseId}" no encontrado.`,
        );
      }

      const user = await tem.findOneOrFail(UserEntity, {
        where: { id: userId },
      });

      const creditsToConsume = 1; // O cualquier otra lógica que determine el costo

      if (user.creditBalance < creditsToConsume) {
        throw new BadRequestException('Créditos insuficientes.');
      }

      const balanceBefore = user.creditBalance;
      user.creditBalance -= creditsToConsume;
      const balanceAfter = user.creditBalance;

      await tem.save(UserEntity, user);

      await this.creditService.internalRecordTransaction(
        {
          targetUserId: user.id,
          action: CreditTransactionAction.USAGE_RESOLUTION,
          amount: -Math.abs(creditsToConsume),
          balanceBefore,
          balanceAfter,
          reason: `Resolución Orden ${exercise.id}`,
        },
        tem,
      );

      const newOrder = tem.create(OrderEntity, {
        userId,
        exerciseId,
        topic: exercise.title,
        status: OrderPipelineStatus.COMPLETED,
        creditsConsumed: creditsToConsume,
        originalImageUrl: exercise.imageUrl1,
        finalVideoUrl: exercise.videoUrl,
        completedAt: new Date(),
      });

      const savedOrder = await tem.save(OrderEntity, newOrder);
      return { ...savedOrder, creditsConsumed: creditsToConsume };
    });
  }

  async getFinalVideoPath(userId: number, orderId: number): Promise<string> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      select: ['id', 'userId', 'finalVideoUrl'],
    });

    if (!order) {
      throw new NotFoundException('La orden no existe.');
    }

    // if (order.userId !== userId) {
    //   // Un usuario no debe poder descargar videos de otro
    //   throw new ForbiddenException(
    //     'No tienes permiso para acceder a este recurso.',
    //   );
    // }

    if (!order.finalVideoUrl) {
      throw new NotFoundException(
        'El video para esta orden aún no está disponible o ha fallado.',
      );
    }

    // Construir la ruta absoluta en el sistema de archivos
    const filePath = join(process.cwd(), 'uploads', order.finalVideoUrl);
    return filePath;
  }
}
