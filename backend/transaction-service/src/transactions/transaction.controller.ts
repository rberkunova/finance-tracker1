// backend/transaction-service/src/transactions/transactions.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
    TransactionsService,
    FinancialSummaryResult,
    PaginatedTransactionsResult,
    MonthlySummaryResult,
    CategoryExpenseResult,
} from './transaction.service';
import { CreateTransactionDto } from './dto/create-transacion.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { Transaction } from './transaction.entity';

@Controller('transactions') // Базовий шлях для всіх ендпоінтів
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTransactionDto): Promise<Transaction> {
    this.logger.log(`Request to create transaction for user ${dto.userId}`);
    return this.transactionsService.create(dto);
  }

  // ОНОВЛЕНИЙ ШЛЯХ для отримання транзакцій користувача
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async findAllByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) queryDto: TransactionQueryDto,
  ): Promise<PaginatedTransactionsResult> {
    this.logger.log(`Request for all transactions for user ${userId} with query: ${JSON.stringify(queryDto)}`);
    return this.transactionsService.findAllByUser(userId, queryDto);
  }

  // ОНОВЛЕНИЙ ШЛЯХ для отримання загального фінансового звіту
  @Get('summary/overall/:userId')
  @HttpCode(HttpStatus.OK)
  async getOverallSummary(
    @Param('userId', ParseUUIDPipe) userId: string
  ): Promise<FinancialSummaryResult> {
    this.logger.log(`Request for overall financial summary for user ${userId}`);
    return this.transactionsService.summary(userId);
  }

  // Новий ендпоінт для місячного звіту
  @Get('summary/monthly/:userId')
  @HttpCode(HttpStatus.OK)
  async getMonthlySummary(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<MonthlySummaryResult> {
    this.logger.log(`Request for monthly summary for user ${userId}`);
    return this.transactionsService.getMonthlySummary(userId);
  }

  // Новий ендпоінт для витрат за категоріями
  @Get('expenses/by-category/:userId')
  @HttpCode(HttpStatus.OK)
  async getCategoryExpenses(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<CategoryExpenseResult[]> {
    this.logger.log(`Request for category expenses for user ${userId}`);
    return this.transactionsService.getCategoryExpenses(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`Request to delete transaction with id ${id}`);
    await this.transactionsService.remove(id);
  }
}