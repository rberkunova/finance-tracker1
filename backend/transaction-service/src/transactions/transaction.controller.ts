// backend/transaction-service/src/transactions/transaction.controller.ts
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
  NotFoundException,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { TransactionsService, FinancialSummaryResult, PaginatedTransactionsResult } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transacion.dto'; // Перевірте назву файлу, можливо create-transaction.dto.ts
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { Transaction } from './transaction.entity';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTransactionDto): Promise<Transaction> {
    return this.transactionsService.create(dto);
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  async findAll( // Назва методу не має значення, важливі декоратори
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) queryDto: TransactionQueryDto,
  ): Promise<PaginatedTransactionsResult> {
    // Передаємо userId та queryDto в сервіс
    return this.transactionsService.findAllByUser(userId, queryDto); // <--- Має приймати 2 аргументи
  }

  @Get(':userId/summary')
  @HttpCode(HttpStatus.OK)
  async summary(@Param('userId', ParseUUIDPipe) userId: string): Promise<FinancialSummaryResult> {
    return this.transactionsService.summary(userId); // <--- Має приймати 1 аргумент
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const wasDeleted = await this.transactionsService.remove(id);
    if (!wasDeleted) {
      // Ця помилка має кидатися з сервісу, якщо result.affected === 0
      throw new NotFoundException(`Transaction with ID "${id}" could not be deleted or was not found.`);
    }
  }
}