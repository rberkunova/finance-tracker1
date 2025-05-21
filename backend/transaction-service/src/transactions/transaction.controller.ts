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
} from '@nestjs/common';
import { TransactionsService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transacion.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTransactionDto) {
    return this.txService.create(dto);
  }

  @Get(':userId')
  findAll(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('type') type?: 'income' | 'expense',
    @Query('category') category?: string,
  ) {
    // Примітка: Валідацію для 'type' та 'category' можна додати за допомогою DTO для query параметрів
    // або кастомних Pipes, якщо потрібна складніша логіка.
    return this.txService.findAllByUser(userId, type, category);
  }

  @Get(':userId/summary')
  summary(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.txService.summary(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    // Важливо: В реальному додатку тут має бути перевірка,
    // що автентифікований користувач має право видаляти цю транзакцію.
    // Наприклад, сервісний метод remove може приймати userId автентифікованого користувача.
    const result = await this.txService.remove(id);
    if (!result) {
      throw new NotFoundException(`Транзакцію з ID "${id}" не знайдено.`);
    }
  }
}
