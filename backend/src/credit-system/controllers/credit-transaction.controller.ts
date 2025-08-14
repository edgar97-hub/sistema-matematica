import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
  Req,
  Res,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CreditService } from '../services/credit.service';
import { CreditTransactionAction } from '../entities/credit-transaction.entity';
import {
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsEnum,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { CustomLoggerService } from '../../common/services/logger.service';
import * as rawBody from 'raw-body';

export class GetAllCreditTransactionsDto {
  @IsOptional()
  @Type(() => Number) // Transforma el query param string a number
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser al menos 1.' })
  page?: number = 1; // Default a la primera página

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite debe ser al menos 1.' })
  limit?: number = 10; // Default a 10 ítems por página

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD).' },
  )
  startDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD).' },
  )
  endDate?: string;

  @IsOptional()
  @IsEnum(CreditTransactionAction, {
    message: 'La acción proporcionada no es válida.',
  })
  action?: CreditTransactionAction;

  @IsOptional()
  @IsString()
  targetUserName?: string; // Cambiado de targetUserId a targetUserName
}

class CreateCheckoutSessionDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  packageId: number;
}

@Controller('credit-transactions')
export class CreditTransactionController {
  constructor(
    private readonly creditService: CreditService,
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async getAllCreditTransactions(
    @Query() queryDto: GetAllCreditTransactionsDto,
  ) {
    this.logger.log(
      `Admin fetching all credit transactions with filters: ${JSON.stringify(queryDto)}`,
      'CreditTransactionController',
    );
    return this.creditService.getAllCreditTransactions(queryDto);
  }

  // @UseGuards(JwtAuthGuard, AdminGuard)
  // @Get('history/:userId')
  // async getUserCreditHistory(
  //   @Param('userId') userId: string,
  //   @Query('page') page: number = 1,
  //   @Query('limit') limit: number = 10,
  // ) {
  //   return this.creditService.getUserCreditHistory(userId, page, limit);
  // }

  @Post('admin/adjust')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminAdjustCredits(
    @Body()
    adjustmentData: { targetUserId: number; amount: number; reason: string },
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any).id;

    const { targetUserId, amount, reason } = adjustmentData;
    return this.creditService.adminAdjustCredits(
      adminUserId,
      targetUserId,
      amount,
      reason,
    );
  }

  @Get('purchase-status/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getPurchaseStatus(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    const userId = (req.user as any).id;

    if (!userId) {
      throw new BadRequestException('User ID not found in token.');
    }

    const transaction =
      await this.creditService.findTransactionByGatewayIdAndUser(
        sessionId,
        userId,
      );

    if (!transaction) {
      return {
        status: 'pending_webhook',
        message: 'La transacción está siendo procesada.',
      };
    }

    if (transaction.action === CreditTransactionAction.PURCHASE_SUCCESS) {
      return {
        status: 'completed',
        message: 'Compra completada y créditos aplicados.',
        creditsAdded: transaction.amount,
        newBalance: transaction.balanceAfter,
      };
    } else {
      return {
        status: 'unknown',
        message: 'El estado de la transacción es desconocido.',
      };
    }
  }
}
