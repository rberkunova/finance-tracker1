// backend/goal-service/src/goals/goals.service.ts
import {
  Injectable, // Переконайтесь, що @Injectable() є
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, GoalStatus } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { RabbitSubscribe, Nack, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config'; // Імпорт ConfigService

const TRANSACTION_CREATED_ROUTING_KEY = 'transaction.created';
const TRANSACTION_DELETED_ROUTING_KEY = 'transaction.deleted';
const EXCHANGE_NAME = 'finance_exchange';

interface TransactionEventData {
  userId: string;
  amount: number;
  transactionType: 'income' | 'expense';
  transactionId: string;
}

@Injectable() // Переконайтесь, що цей декоратор є
export class GoalsService implements OnModuleInit, OnModuleDestroy { // <--- ДОДАЙТЕ "export" ТУТ
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    private readonly amqpConnection: AmqpConnection, // Переконайтесь, що AmqpConnection інжектується
    private readonly configService: ConfigService,   // Переконайтесь, що ConfigService інжектується
  ) {}

  async onModuleInit() {
    if (this.amqpConnection.connected) {
      this.logger.log('RabbitMQ connection is active for GoalService.');
    } else {
      this.logger.warn('RabbitMQ connection is not active at onModuleInit for GoalService. Module will attempt to connect/reconnect.');
    }
    this.logger.log('GoalService initialized.');
  }

  async onModuleDestroy() {
    this.logger.log('GoalService destroyed.');
  }
  
  @RabbitSubscribe({
    exchange: EXCHANGE_NAME,
    routingKey: TRANSACTION_CREATED_ROUTING_KEY,
    queue: 'goal_service_transaction_created_queue',
    queueOptions: { durable: true },
  })
  public async handleTransactionCreated(eventData: TransactionEventData) {
    this.logger.log(`Received transaction_created event for user ${eventData.userId}, data: ${JSON.stringify(eventData)}`);
    try {
      await this.processTransactionEventLogic(
        eventData.userId,
        eventData.amount,
        eventData.transactionType,
        'created'
      );
    } catch (error) {
      this.logger.error(`Error processing transaction_created event for user ${eventData.userId}: ${error.message}`, error.stack);
      return new Nack(false); 
    }
  }
  
  @RabbitSubscribe({
    exchange: EXCHANGE_NAME,
    routingKey: TRANSACTION_DELETED_ROUTING_KEY,
    queue: 'goal_service_transaction_deleted_queue',
    queueOptions: { durable: true },
  })
  public async handleTransactionDeleted(eventData: TransactionEventData) {
    this.logger.log(`Received transaction_deleted event for user ${eventData.userId}, data: ${JSON.stringify(eventData)}`);
    try {
      await this.processTransactionEventLogic(
        eventData.userId,
        eventData.amount,
        eventData.transactionType,
        'deleted'
      );
    } catch (error) {
      this.logger.error(`Error processing transaction_deleted event for user ${eventData.userId}: ${error.message}`, error.stack);
      return new Nack(false);
    }
  }

  async processTransactionEventLogic(
    eventUserId: string,
    transactionAmount: number,
    transactionType: 'income' | 'expense',
    eventType: 'created' | 'deleted'
  ) {
    this.logger.log(
      `GoalService: Applying ${eventType} transaction event for user ${eventUserId}, amount ${transactionAmount}, type ${transactionType}`,
    );
    const activeGoals = await this.goalRepository.find({
      where: { userId: eventUserId, status: GoalStatus.IN_PROGRESS },
      order: { deadline: 'ASC' },
    });

    if (activeGoals.length === 0) {
      this.logger.log(`GoalService: No active goals found for user ${eventUserId}.`);
      return;
    }

    for (const goal of activeGoals) {
      let amountChange = 0;
      if (transactionType === 'income' && eventType === 'created') {
        const amountNeeded = Math.max(0, goal.targetAmount - goal.currentAmount);
        amountChange = Math.min(transactionAmount, amountNeeded);
      } else if (eventType === 'deleted' && transactionType === 'income') {
        amountChange = -transactionAmount;
      }

      if (amountChange !== 0) {
        goal.currentAmount = Math.max(0, Number(goal.currentAmount) + amountChange);
        if (goal.currentAmount >= goal.targetAmount) {
          goal.currentAmount = goal.targetAmount;
          goal.status = GoalStatus.COMPLETED;
        } else if (goal.status === GoalStatus.COMPLETED && goal.currentAmount < goal.targetAmount) {
          goal.status = GoalStatus.IN_PROGRESS;
        }
        await this.goalRepository.save(goal);
        this.logger.log(`Goal "${goal.goalName}" (ID: ${goal.id}) for user ${eventUserId} updated. New current amount: ${goal.currentAmount}. Status: ${goal.status}`);
      }
      if (transactionType === 'income' && amountChange > 0 && eventType === 'created') {
          // break; 
      }
    }
  }

  async create(createGoalDto: CreateGoalDto, callingUserId: string): Promise<Goal> {
    if (createGoalDto.userId !== callingUserId) {
      throw new ForbiddenException('You can only create goals for yourself.');
    }
    const deadlineDate = new Date(createGoalDto.deadline);
    if (isNaN(deadlineDate.getTime())) {
      throw new BadRequestException('Invalid deadline date format.');
    }
    const newGoalEntityData: Partial<Goal> = {
      userId: createGoalDto.userId,
      goalName: createGoalDto.goalName,
      targetAmount: createGoalDto.targetAmount,
      currentAmount: createGoalDto.currentAmount ?? 0,
      deadline: deadlineDate,
      status: createGoalDto.status ?? GoalStatus.IN_PROGRESS,
    };
    const newGoal = this.goalRepository.create(newGoalEntityData);
    return this.goalRepository.save(newGoal);
  }

  async findAllByUserId(userId: string): Promise<Goal[]> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided to retrieve goals.');
    }
    return this.goalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByIdAndUserId(goalId: string, userId: string): Promise<Goal> {
    if (!userId) throw new ForbiddenException('User ID must be provided for this operation.');
    if (!goalId) throw new BadRequestException('Goal ID must be provided.');
    const goal = await this.goalRepository.findOne({ where: { id: goalId, userId } });
    if (!goal) {
      throw new NotFoundException(
        `Goal with ID "${goalId}" not found or does not belong to user "${userId}".`,
      );
    }
    return goal;
  }

  async update(
    goalId: string,
    userId: string,
    updateGoalDto: UpdateGoalDto,
  ): Promise<Goal> {
    const goal = await this.findOneByIdAndUserId(goalId, userId);
    const updatePayload: Partial<Goal> = {};
    if (updateGoalDto.goalName !== undefined) updatePayload.goalName = updateGoalDto.goalName;
    if (updateGoalDto.targetAmount !== undefined) updatePayload.targetAmount = updateGoalDto.targetAmount;
    if (updateGoalDto.currentAmount !== undefined) updatePayload.currentAmount = updateGoalDto.currentAmount;
    if (updateGoalDto.status !== undefined) updatePayload.status = updateGoalDto.status;
    if (updateGoalDto.deadline) {
      const deadlineDate = new Date(updateGoalDto.deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new BadRequestException('Invalid deadline date format for update.');
      }
      updatePayload.deadline = deadlineDate;
    }
    this.goalRepository.merge(goal, updatePayload);
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = GoalStatus.COMPLETED;
    } else if (goal.deadline && goal.deadline.getTime() < new Date().setHours(0, 0, 0, 0) && goal.status !== GoalStatus.COMPLETED) {
      // goal.status = GoalStatus.FAILED;
    } else if (goal.status === GoalStatus.COMPLETED && goal.currentAmount < goal.targetAmount) {
      goal.status = GoalStatus.IN_PROGRESS;
    }
    return this.goalRepository.save(goal);
  }

  async remove(goalId: string, userId: string): Promise<void> {
    await this.findOneByIdAndUserId(goalId, userId);
    const result = await this.goalRepository.delete({ id: goalId, userId });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Goal with ID "${goalId}" could not be deleted or was not found for user "${userId}".`,
      );
    }
  }
}
