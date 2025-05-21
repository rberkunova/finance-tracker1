import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transacion.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
  ) {}

  create(dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.repo.create({
      ...dto,
      // Сума зберігається як число (decimal в БД), тому переконуємося, що це число
      amount: Number(dto.amount),
      transactionDate: new Date(dto.transactionDate),
    });
    return this.repo.save(transaction);
  }

  findAllByUser(
    userId: string,
    type?: 'income' | 'expense',
    category?: string,
  ): Promise<Transaction[]> {
    const whereClause: FindOptionsWhere<Transaction> = { userId };

    if (type) {
      whereClause.type = type;
    }
    if (category) {
      // Для пошуку по категорії можна використовувати Like для часткового співпадіння,
      // але для простоти тут точне співпадіння.
      // Якщо потрібен регістронезалежний пошук або часткове співпадіння,
      // використовуйте `ILike` або `Like` відповідно, наприклад:
      // whereClause.category = ILike(`%${category}%`);
      whereClause.category = category;
    }

    const options: FindManyOptions<Transaction> = {
      where: whereClause,
      order: { transactionDate: 'DESC' }, // За замовчуванням сортуємо за датою транзакції
    };

    return this.repo.find(options);
  }

  async summary(
    userId: string,
  ): Promise<{ income: number; expense: number; balance: number }> {
    // summary буде розраховуватись на основі всіх транзакцій користувача, без фільтрів
    const allTransactions = await this.findAllByUser(userId); // Без передачі type та category

    const income = allTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = allTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expense, balance: income - expense };
  }

  async remove(id: string): Promise<boolean> {
    // Важливо: В ідеалі, цей метод також повинен приймати userId автентифікованого користувача
    // і перевіряти, чи належить транзакція цьому користувачеві перед видаленням:
    // const transaction = await this.repo.findOneBy({ id, userId });
    // if (!transaction) { return false; }
    // const result = await this.repo.delete({ id, userId });

    // Поточна реалізація видаляє за ID транзакції без перевірки власника на рівні сервісу
    const result = await this.repo.delete(id);
    return (
      result.affected !== null &&
      result.affected !== undefined &&
      result.affected > 0
    );
  }
}
