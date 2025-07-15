import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreditService } from '../services/credit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/decorators/user.decorator';
import { UserEntity } from '../../users/entities/user.entity';
import { CustomLoggerService } from '../../common/services/logger.service';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(
    private readonly creditService: CreditService,
    private readonly logger: CustomLoggerService,
  ) {}

  // @Post('use')
  // async useCredits(
  //   @User() user: UserEntity,
  //   @Body('amount', ParseIntPipe) amount: number,
  //   @Body('description') description: string,
  // ) {
  //   try {
  //     const result = await this.creditService.useCredits(user.id, amount, description);
  //     this.logger.log(`User ${user.id} used credits: ${result.id}`, 'CreditController');
  //     return result;
  //   } catch (error) {
  //     this.logger.error(`Error in using credits: ${error.message}`, error.stack, 'CreditController');
  //     throw new HttpException('Failed to use credits', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  // @Get('balance')
  // async getCreditBalance(@User() user: UserEntity) {
  //   try {
  //     const balance = await this.creditService.getCreditBalance(user.id);
  //     this.logger.log(`Retrieved credit balance for user ${user.id}`, 'CreditController');
  //     return { balance };
  //   } catch (error) {
  //     this.logger.error(`Error in getting credit balance: ${error.message}`, error.stack, 'CreditController');
  //     throw new HttpException('Failed to get credit balance', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  // @Get('transactions')
  // async getCreditTransactions(@User() user: UserEntity) {
  //   try {
  //     const transactions = await this.creditService.getCreditTransactions(user.id);
  //     this.logger.log(`Retrieved credit transactions for user ${user.id}`, 'CreditController');
  //     return transactions;
  //   } catch (error) {
  //     this.logger.error(`Error in getting credit transactions: ${error.message}`, error.stack, 'CreditController');
  //     throw new HttpException('Failed to get credit transactions', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }
}
