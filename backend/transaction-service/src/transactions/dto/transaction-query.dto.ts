// backend/transaction-service/src/transactions/dto/transaction-query.dto.ts
import { IsOptional, IsIn, IsString, IsEnum, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer'; // Для перетворення типів з query string

// Можливі поля для сортування (мають відповідати полям сутності Transaction)
export const validTransactionSortByFields = ['transactionDate', 'amount', 'category', 'type', 'createdAt'] as const;
export type TransactionSortBy = typeof validTransactionSortByFields[number];

export const validSortOrderValues = ['ASC', 'DESC'] as const;
export type SortOrder = typeof validSortOrderValues[number];

export class TransactionQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Перетворює рядок запиту на число
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100) // Обмеження на кількість записів на сторінку
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['income', 'expense'], { message: 'Type must be either income or expense' })
  type?: 'income' | 'expense';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @IsOptional()
  @IsIn(validTransactionSortByFields, { message: `sortBy must be one of the following: ${validTransactionSortByFields.join(', ')}`})
  sortBy?: TransactionSortBy = 'transactionDate'; // Поле сортування за замовчуванням

  @IsOptional()
  @IsIn(validSortOrderValues, { message: `sortOrder must be either ASC or DESC`})
  sortOrder?: SortOrder = 'DESC'; // Напрямок сортування за замовчуванням
}