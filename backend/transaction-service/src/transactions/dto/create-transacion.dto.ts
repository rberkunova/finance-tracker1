import {
  IsUUID,
  IsNumber,
  IsEnum,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  amount: number;

  @IsEnum(['income', 'expense'])
  type: 'income' | 'expense';

  @IsString()
  category: string;

  @IsString()
  description: string;

  @IsDateString()
  transactionDate: string;
}
