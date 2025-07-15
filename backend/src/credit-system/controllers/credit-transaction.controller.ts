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
import { StripeService } from '../services/stripe.service';
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
  @IsString() // O IsUUID() si es UUID, IsNumberString() si es número pero viene como string
  targetUserId?: string; // Añadido para el filtro
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
    private readonly stripeService: StripeService,
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

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    const { packageId } = createCheckoutSessionDto;

    const session = await this.stripeService.createStripeCheckoutSession(
      userId,
      packageId,
    );
    return { ...session };
  }

  @Post('stripe-webhook')
  async handleStripeWebhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!sig || !webhookSecret) {
      this.logger.warn(
        'Stripe webhook missing signature or secret.',
        'CreditTransactionController',
      );
      return res.status(400).send('Webhook signature or secret missing.');
    }
    const requestBodyBuffer = req.body as Buffer;
    console.log('Webhook Received. Has rawBody:', requestBodyBuffer);
    if (!requestBodyBuffer) {
      this.logger.error(
        'Raw body is not available for Stripe webhook verification.',
        '',
        'CreditTransactionController',
      );
      return res
        .status(400)
        .send(
          'Webhook error: Raw body not available. Ensure NestJS is configured for raw body parsing on this route.',
        );
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(
        requestBodyBuffer,
        sig,
        webhookSecret,
      );
      this.logger.log(
        `Stripe webhook event received: ${event.id}, type: ${event.type}`,
        'CreditTransactionController',
      );
    } catch (err: any) {
      this.logger.error(
        `⚠️  Webhook signature verification failed: ${err.message}`,
        err.stack,
        'CreditTransactionController',
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        this.logger.log(
          `Processing checkout.session.completed for session: ${session.id}`,
          'CreditTransactionController',
        );
        try {
          // Pasar la sesión completa o solo los datos relevantes
          await this.creditService.handleSuccessfulCheckoutSession(session);
          this.logger.log(
            `Successfully processed checkout.session.completed for: ${session.id}`,
            'CreditTransactionController',
          );
        } catch (error: any) {
          // ¡Importante! Loguear el error pero aún así devolver 200 a Stripe
          // para evitar que Stripe reintente el webhook indefinidamente por este error.
          // Necesitarás un sistema de monitoreo/alerta para estos errores internos.
          this.logger.error(
            `Error processing checkout session ${session.id} in CreditService: ${error.message}`,
            error.stack,
            'CreditTransactionController',
          );
        }
        break;
      // case 'payment_intent.succeeded': // Otro evento que podrías querer manejar
      //   const paymentIntent = event.data.object;
      //   this.logger.log(`PaymentIntent succeeded: ${paymentIntent.id}`, 'CreditTransactionController');
      //   // Lógica para PaymentIntent si no usas Checkout Session para todo
      //   break;
      // ... manejar otros tipos de eventos relevantes de Stripe
      default:
        this.logger.log(
          `Unhandled Stripe event type: ${event.type}`,
          'CreditTransactionController',
        );
    }

    // Devolver una respuesta 200 a Stripe para confirmar la recepción del evento
    res.status(200).json({ received: true });
  }
}
