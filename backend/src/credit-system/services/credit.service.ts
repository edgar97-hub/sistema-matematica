import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  FindManyOptions,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  ILike,
} from 'typeorm';
import { CreditPackageEntity } from '../entities/credit-package.entity';
import {
  CreditTransactionEntity,
  CreditTransactionAction,
} from '../entities/credit-transaction.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CustomLoggerService } from '../../common/services/logger.service';
import { GetAllCreditTransactionsDto } from '../controllers/credit-transaction.controller';
import { AdminUserEntity } from 'src/admin-users/entities/admin-user.entity';

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(CreditPackageEntity)
    private creditPackageRepository: Repository<CreditPackageEntity>,
    @InjectRepository(CreditTransactionEntity)
    private creditTransactionRepository: Repository<CreditTransactionEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private logger: CustomLoggerService,
    private entityManager: EntityManager,
  ) {}

  async getAllCreditTransactions(
    queryDto: GetAllCreditTransactionsDto,
  ): Promise<{
    data: CreditTransactionEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1, // Usar defaults del DTO
      limit = 10,
      startDate,
      endDate,
      action,
      targetUserName, // Cambiado de targetUserId a targetUserName
    } = queryDto;

    const skip = (page - 1) * limit;

    // Construir objeto 'where' para TypeORM dinámicamente
    const where: FindOptionsWhere<CreditTransactionEntity> = {};

    if (targetUserName) {
      // Filtrar por el nombre del usuario relacionado
      where.targetUser = {
        name: ILike(`%${targetUserName}%`),
      };
    }
    if (action) {
      where.action = action;
    }
    if (startDate && endDate) {
      where.createdAt = Between(
        new Date(startDate),
        new Date(endDate + 'T23:59:59.999Z'),
      ); // Incluir todo el día de endDate
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate + 'T23:59:59.999Z'));
    }

    this.logger.log(
      `Querying credit transactions with where: ${JSON.stringify(where)}, skip: ${skip}, take: ${limit}`,
      'CreditService',
    );

    try {
      const [data, total] = await this.creditTransactionRepository.findAndCount(
        {
          where,
          relations: ['targetUser', 'adminUser', 'creditPackage'], // Cargar relaciones para mostrar nombres
          order: { createdAt: 'DESC' }, // Orden por defecto, o podrías tomarlo del DTO
          skip: skip,
          take: limit,
          // Asegurarse de que la relación 'targetUser' se cargue para poder filtrar por nombre
          // y para que el mapeo de formattedData funcione correctamente.
        },
      );

      // Mapear para asegurar que solo se devuelven los campos necesarios y con formato
      // Esto es opcional, pero bueno para controlar la respuesta.
      const formattedData = data.map((tx) => ({
        ...tx,
        targetUser: tx.targetUser
          ? {
              id: tx.targetUser.id,
              name: tx.targetUser.name,
              email: tx.targetUser.email,
            }
          : undefined,
        adminUser: tx.adminUser
          ? { id: tx.adminUser.id, name: tx.adminUser.name }
          : undefined,
        creditPackage: tx.creditPackage
          ? { id: tx.creditPackage.id, name: tx.creditPackage.name }
          : undefined,
      }));

      return {
        data: formattedData as any, // Castear si es necesario después del mapeo
        total,
        page: Number(page), // Asegurar que sea número
        limit: Number(limit), // Asegurar que sea número
      };
    } catch (error) {
      this.logger.error(
        `Error fetching all credit transactions: ${error.message}`,
        error.stack,
        'CreditService',
      );
      throw error;
    }
  }

  // async getUserCreditHistory(
  //   targetUserId: string,
  //   page: number,
  //   limit: number,
  // ): Promise<{ data: CreditTransactionEntity[]; total: number }> {
  //   try {
  //     const [data, total] = await this.creditTransactionRepository.findAndCount(
  //       {
  //         where: { targetUserId: parseInt(targetUserId) },
  //         order: { createdAt: 'DESC' },
  //         skip: (page - 1) * limit,
  //         take: limit,
  //       },
  //     );
  //     return { data, total };
  //   } catch (error) {
  //     this.logger.error(
  //       `Error getting user credit history: ${error.message}`,
  //       error.stack,
  //       'CreditService',
  //     );
  //     throw error;
  //   }
  // }

  async recordTransaction(
    data: Partial<CreditTransactionEntity>,
  ): Promise<CreditTransactionEntity> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const user = await transactionalEntityManager.findOne(UserEntity, {
          where: { id: data.targetUserId },
        });
        if (!user) {
          throw new NotFoundException(
            `User with ID "${data.targetUserId}" not found`,
          );
        }

        if (typeof data.amount !== 'number') {
          throw new BadRequestException('Transaction amount must be a number');
        }

        // const balanceBefore = user.creditBalance;
        // user.creditBalance += data.amount;
        // const balanceAfter = user.creditBalance;

        const transaction = transactionalEntityManager.create(
          CreditTransactionEntity,
          {
            ...data,
            // balanceBefore: balanceBefore,
            // balanceAfter: balanceAfter,
          },
        );

        // await transactionalEntityManager.save(user);
        await transactionalEntityManager.save(transaction);

        return transaction;
      },
    );
  }

  // async purchaseCredits(
  //   userId: number,
  //   packageId: number,
  // ): Promise<CreditTransactionEntity> {
  //   try {
  //     const creditPackage = await this.creditPackageRepository.findOne({
  //       where: { id: packageId },
  //     });
  //     if (!creditPackage) {
  //       throw new NotFoundException(
  //         `Credit package with ID "${packageId}" not found`,
  //       );
  //     }

  //     const paymentIntent = await this.stripeService.createPaymentIntent(
  //       creditPackage.price * 100,
  //       'usd',
  //     );

  //     const transaction = await this.recordTransaction({
  //       action: CreditTransactionAction.PURCHASE_SUCCESS,
  //       amount: creditPackage.creditAmount,
  //       targetUserId: userId,
  //       creditPackageId: packageId,
  //       paymentGateway: 'stripe',
  //       gatewayTransactionId: paymentIntent.id,
  //       gatewayTransactionStatus: paymentIntent.status,
  //       gatewayResponsePayload: paymentIntent,
  //     });

  //     this.logger.log(
  //       `Credit purchase initiated: ${transaction.id}`,
  //       'CreditService',
  //     );
  //     return transaction;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error purchasing credits: ${error.message}`,
  //       error.stack,
  //       'CreditService',
  //     );
  //     throw error;
  //   }
  //   // res.json({ received: true });
  // }

  // async confirmCreditPurchase(sessionId: string): Promise<void> {
  //   try {
  //     const session =
  //       await this.stripeService.retrieveCheckoutSession(sessionId);

  //     if (session.payment_status !== 'paid') {
  //       this.logger.warn(
  //         `Checkout session ${sessionId} is not paid`,
  //         'CreditService',
  //       );
  //       return;
  //     }

  //     if (!session.client_reference_id || !session.metadata?.packageId) {
  //       throw new Error('Missing user ID or package ID in session metadata');
  //     }

  //     const userId = parseInt(session.client_reference_id);
  //     const packageId = parseInt(session.metadata.packageId);

  //     if (isNaN(userId) || isNaN(packageId)) {
  //       throw new Error('Invalid user ID or package ID in session metadata');
  //     }

  //     const creditPackage = await this.creditPackageRepository.findOne({
  //       where: { id: packageId },
  //     });
  //     if (!creditPackage) {
  //       throw new NotFoundException(
  //         `Credit package with ID ${packageId} not found`,
  //       );
  //     }

  //     await this.recordTransaction({
  //       action: CreditTransactionAction.PURCHASE_SUCCESS,
  //       amount: creditPackage.creditAmount,
  //       targetUserId: userId,
  //       creditPackageId: packageId,
  //       paymentGateway: 'stripe',
  //       gatewayTransactionId: sessionId,
  //       gatewayTransactionStatus: 'completed',
  //     });

  //     this.logger.log(
  //       `Credit purchase confirmed for user ${userId}, package ${packageId}`,
  //       'CreditService',
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Error confirming credit purchase: ${error.message}`,
  //       error.stack,
  //       'CreditService',
  //     );
  //     throw error;
  //   }
  // }


  // async useCredits(
  //   userId: number,
  //   amount: number,
  //   description: string,
  // ): Promise<CreditTransactionEntity> {
  //   try {
  //     return await this.recordTransaction({
  //       action: CreditTransactionAction.USAGE_RESOLUTION,
  //       amount: -amount,
  //       targetUserId: userId,
  //       reason: description,
  //     });
  //   } catch (error) {
  //     this.logger.error(
  //       `Error using credits: ${error.message}`,
  //       error.stack,
  //       'CreditService',
  //     );
  //     throw error;
  //   }
  // }

  // async getCreditBalance(userId: number): Promise<number> {
  //   try {
  //     const user = await this.userRepository.findOne({ where: { id: userId } });
  //     if (!user) {
  //       throw new NotFoundException(`User with ID "${userId}" not found`);
  //     }
  //     return user.creditBalance;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error getting credit balance: ${error.message}`,
  //       error.stack,
  //       'CreditService',
  //     );
  //     throw error;
  //   }
  // }

  // async getCreditTransactions(
  //   userId: number,
  // ): Promise<CreditTransactionEntity[]> {
  //   try {
  //     return this.creditTransactionRepository.find({
  //       where: { targetUserId: userId },
  //       order: { createdAt: 'DESC' },
  //     });
  //   } catch (error) {
  //     this.logger.error(
  //       `Error getting credit transactions: ${error.message}`,
  //       error.stack,
  //       'CreditService',
  //     );
  //     throw error;
  //   }
  // }

  async adminAdjustCredits(
    adminUserId: number,
    targetUserId: number,
    amount: number,
    reason: string,
  ): Promise<CreditTransactionEntity> {
    return this.entityManager.transaction(async (tem) => {
      const userRepo = tem.getRepository(UserEntity);
      const user = await userRepo.findOneBy({ id: targetUserId });
      if (!user)
        throw new NotFoundException(`User with ID ${targetUserId} not found.`);

      const balanceBefore = user.creditBalance;
      user.creditBalance += amount; // 'amount' puede ser positivo o negativo
      const balanceAfter = user.creditBalance;

      await userRepo.save(user);

      return this.internalRecordTransaction(
        {
          targetUserId: user.id,
          adminUserId: adminUserId, // ID del admin que realiza la acción
          action: CreditTransactionAction.ADMIN_ADJUSTMENT,
          amount: amount,
          balanceBefore,
          balanceAfter,
          reason,
        },
        tem,
      );
    });
  }

  async addWelcomeCredits(
    targetUserId: number,
    amount: number,
  ): Promise<CreditTransactionEntity> {
    try {
      return this.entityManager.transaction(async (tem) => {
        const userRepo = tem.getRepository(UserEntity);
        const user = await userRepo.findOneBy({ id: targetUserId });
        if (!user)
          throw new NotFoundException(
            `User with ID ${targetUserId} not found.`,
          );

        const balanceBefore = user.creditBalance;
        user.creditBalance += amount;
        const balanceAfter = user.creditBalance;

        await userRepo.save(user);

        return this.internalRecordTransaction(
          {
            targetUserId: targetUserId,
            action: CreditTransactionAction.WELCOME_BONUS,
            amount: amount,
            balanceBefore,
            balanceAfter,
            reason: 'Créditos de bonificación de bienvenida',
          },
          tem,
        );
      });
    } catch (error) {
      this.logger.error(
        `Error adding welcome credits: ${error.message}`,
        error.stack,
        'CreditService',
      );
      throw error;
    }
  }

  async findTransactionByGatewayIdAndUser(
    gatewayTransactionId: string,
    targetUserId: number,
  ): Promise<CreditTransactionEntity | null> {
    this.logger.log(
      `Finding transaction by gatewayId: ${gatewayTransactionId} for user: ${targetUserId}`,
      'CreditService',
    );
    return this.creditTransactionRepository.findOne({
      where: {
        gatewayTransactionId,
        targetUserId: targetUserId, // Asegurar que la transacción pertenezca al usuario
        action: CreditTransactionAction.PURCHASE_SUCCESS, // Solo nos interesan las compras exitosas
      },
    });
  }

  async internalRecordTransaction(
    data: Partial<CreditTransactionEntity>,
    manager: EntityManager,
  ): Promise<CreditTransactionEntity> {
    const transactionRepo = manager.getRepository(CreditTransactionEntity);
    const transaction = transactionRepo.create(data);
    return transactionRepo.save(transaction);
  }
}
