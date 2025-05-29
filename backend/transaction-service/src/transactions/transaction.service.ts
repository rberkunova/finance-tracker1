import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder, Between } from 'typeorm'; // Додано Between
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transacion.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';

// Існуючі інтерфейси
export interface FinancialSummaryResult {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface PaginatedTransactionsResult {
  transactions: Transaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// НОВІ ІНТЕРФЕЙСИ для аналітики
export interface MonthlySummaryResult {
  monthIncome: number;
  monthExpense: number;
}

export interface CategoryExpenseResult {
  category: string;
  totalAmount: number;
}

// Константи для RabbitMQ
const EXCHANGE_NAME = 'finance_exchange';
const TRANSACTION_CREATED_ROUTING_KEY = 'transaction.created';
const TRANSACTION_DELETED_ROUTING_KEY = 'transaction.deleted';

@Injectable()
export class TransactionsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.amqpConnection.connected) {
      this.logger.log('RabbitMQ connection is active for TransactionService Publisher.');
    } else {
      this.logger.warn('RabbitMQ connection is NOT active at onModuleInit for TransactionService Publisher.');
    }
    this.logger.log('TransactionService initialized.');
  }

  async onModuleDestroy() {
    this.logger.log('TransactionService destroyed.');
  }

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    const transactionDateObject = new Date(dto.transactionDate);
    if (isNaN(transactionDateObject.getTime())) {
      throw new BadRequestException('Invalid date format for transactionDate');
    }

    const transactionEntity = this.transactionRepository.create({
      ...dto,
      amount: Number(dto.amount),
      transactionDate: transactionDateObject,
    });
    const savedTransaction = await this.transactionRepository.save(transactionEntity);

    if (this.amqpConnection.connected) {
      try {
        const eventPayload = {
          userId: savedTransaction.userId,
          amount: savedTransaction.amount,
          transactionType: savedTransaction.type,
          transactionId: savedTransaction.id,
        };
        this.amqpConnection.publish(EXCHANGE_NAME, TRANSACTION_CREATED_ROUTING_KEY, eventPayload);
        this.logger.log(`Published event [${TRANSACTION_CREATED_ROUTING_KEY}] to exchange [${EXCHANGE_NAME}]`);
      } catch (error) {
        this.logger.error('Failed to publish transaction_created event to RabbitMQ:', error.message, error.stack);
      }
    } else {
      this.logger.warn(`RabbitMQ not connected. Event for transaction ${savedTransaction.id} not published.`);
    }
    return savedTransaction;
  }

  async findAllByUser(
    userId: string,
    queryDto: TransactionQueryDto,
  ): Promise<PaginatedTransactionsResult> {
    const { type, category, page = 1, limit = 10, sortBy = 'transactionDate', sortOrder = 'DESC' } = queryDto;
    const whereClause: FindOptionsWhere<Transaction> = { userId };
    if (type) { (whereClause as FindOptionsWhere<Transaction>).type = type; }
    if (category) { (whereClause as FindOptionsWhere<Transaction>).category = category; }
    const orderClause: FindOptionsOrder<Transaction> = { [sortBy as string]: sortOrder };
    const skip = (page - 1) * limit;

    try {
      const [transactions, totalCount] = await this.transactionRepository.findAndCount({
        where: whereClause, order: orderClause, skip, take: limit,
      });
      return { transactions, totalCount, currentPage: Number(page), totalPages: Math.ceil(totalCount / limit) };
    } catch (error) {
      this.logger.error(`findAllByUser: DB error for user ${userId}:`, error.stack);
      throw new InternalServerErrorException('Database error while fetching transactions.');
    }
  }

  async summary(userId: string): Promise<FinancialSummaryResult> {
    try {
      const allTransactions = await this.transactionRepository.find({ where: { userId } });
      const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
      return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
    } catch (error) {
      this.logger.error(`summary: DB error for user ${userId}:`, error.stack);
      throw new InternalServerErrorException('Database error while calculating overall summary.');
    }
  }

  /**
   * НОВИЙ МЕТОД: Розраховує доходи та витрати за поточний календарний місяць.
   */
  async getMonthlySummary(userId: string): Promise<MonthlySummaryResult> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // Початок дня
    // Кінець поточного дня для запиту "до сьогодні включно"
    const endOfCurrentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    this.logger.log(`Fetching monthly summary for user ${userId} from ${firstDayOfMonth.toISOString()} to ${endOfCurrentDay.toISOString()}`);
    try {
      const monthTransactions = await this.transactionRepository.find({
        where: {
          userId,
          transactionDate: Between(firstDayOfMonth, endOfCurrentDay),
        },
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return { monthIncome, monthExpense };
    } catch (error) {
      this.logger.error(`getMonthlySummary: DB error for user ${userId}:`, error.stack);
      throw new InternalServerErrorException('Database error while calculating monthly summary.');
    }
  }

  /**
   * НОВИЙ МЕТОД: Розраховує витрати, згруповані за категоріями, за поточний календарний місяць.
   */
  async getCategoryExpenses(userId: string): Promise<CategoryExpenseResult[]> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfCurrentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);


    this.logger.log(`Fetching category expenses for user ${userId} from ${firstDayOfMonth.toISOString()} to ${endOfCurrentDay.toISOString()}`);
    try {
      const result = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('transaction.category', 'category')
        .addSelect('SUM(transaction.amount)', 'totalAmount') // SUM поверне рядок для decimal, або число для integer
        .where('transaction.userId = :userId', { userId })
        .andWhere('transaction.type = :type', { type: 'expense' })
        .andWhere('transaction.transactionDate >= :startDate', { startDate: firstDayOfMonth })
        .andWhere('transaction.transactionDate <= :endDate', { endDate: endOfCurrentDay })
        .groupBy('transaction.category')
        .orderBy('SUM(transaction.amount)', 'DESC') // Сортуємо за спаданням суми
        .getRawMany<{ category: string; totalAmount: string | number }>(); // totalAmount може бути рядком

      return result.map(item => ({
        category: item.category,
        totalAmount: parseFloat(String(item.totalAmount)) || 0, // Перетворюємо на число
      }));
    } catch (error) {
      this.logger.error(`getCategoryExpenses: DB error for user ${userId}:`, error.stack);
      throw new InternalServerErrorException('Database error while fetching category expenses.');
    }
  }

  async remove(id: string): Promise<boolean> {
    const transactionToRemove = await this.transactionRepository.findOne({ where: {id}});
    if (!transactionToRemove) {
        throw new NotFoundException(`Transaction with ID "${id}" not found.`);
    }
    try {
      const result = await this.transactionRepository.delete(id);
      if (result.affected === 0) { 
        throw new NotFoundException(`Transaction with ID "${id}" not found (already deleted or failed).`);
      }
      
      if (this.amqpConnection.connected) {
        try {
          const eventPayload = {
              userId: transactionToRemove.userId,
              amount: transactionToRemove.amount,
              transactionType: transactionToRemove.type,
              transactionId: id,
          };
          this.amqpConnection.publish(EXCHANGE_NAME, TRANSACTION_DELETED_ROUTING_KEY, eventPayload);
          this.logger.log(`Published delete event for transaction ${id}`);
        } catch (pubError) {
          this.logger.error(`Failed to publish delete event for transaction ${id}:`, pubError.message);
        }
      } else {
          this.logger.warn(`RabbitMQ not connected. Delete event for transaction ${id} not published.`);
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`remove: DB error for transaction ${id}:`, error.stack);
      throw new InternalServerErrorException('Database error while removing transaction.');
    }
  }
}