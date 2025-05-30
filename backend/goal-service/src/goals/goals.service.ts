// backend/goal-service/src/goals/goals.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, GoalStatus } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { RabbitSubscribe, Nack, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const TRANSACTION_CREATED_ROUTING_KEY = 'transaction.created';
const TRANSACTION_DELETED_ROUTING_KEY = 'transaction.deleted';
const EXCHANGE_NAME = 'finance_exchange';

interface TransactionEventData {
  userId: string;
  amount: number;
  transactionType: 'income' | 'expense';
  transactionId: string;
}

interface FinancialSummaryResult { 
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

@Injectable()
export class GoalsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GoalsService.name);
  private readonly transactionServiceUrl: string;

  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const configuredUrl = this.configService.get<string>('TRANSACTION_SERVICE_URL');
    if (!configuredUrl) {
      this.logger.error('CRITICAL: TRANSACTION_SERVICE_URL is not configured in environment variables for goal-service!');
      throw new Error('CRITICAL: TRANSACTION_SERVICE_URL is not configured. GoalService cannot operate.');
    }
    this.transactionServiceUrl = configuredUrl;
  }

  async onModuleInit() {
    if (this.amqpConnection.connected && this.amqpConnection.connected !== undefined) {
      this.logger.log('RabbitMQ connection is active for GoalService.');
    } else {
      this.logger.warn('RabbitMQ connection is not active at onModuleInit for GoalService.');
    }
    this.logger.log(`GoalService initialized. TransactionService URL: ${this.transactionServiceUrl}`);
  }

  async onModuleDestroy() {
    this.logger.log('GoalService destroyed.');
  }

  private async getUserBalance(userId: string): Promise<number> {
    // URL оновлено відповідно до змін в TransactionController (GET /transactions/summary/overall/:userId)
    const summaryUrl = `${this.transactionServiceUrl}/transactions/summary/overall/${userId}`;
    this.logger.log(`GoalsService: Attempting to fetch balance for user ${userId} from ${summaryUrl}`);
    try {
      const response = await firstValueFrom(
        this.httpService.get<FinancialSummaryResult>(summaryUrl, { timeout: 5000 }),
      );
      
      if (typeof response.data.balance !== 'number' || isNaN(response.data.balance)) {
        this.logger.error(`GoalsService: Received invalid balance for user ${userId} from ${summaryUrl}: ${JSON.stringify(response.data)}. Expected 'balance' to be a number.`);
        throw new InternalServerErrorException('Invalid balance data received from transaction service.');
      }
      this.logger.log(`GoalsService: Successfully fetched balance for user ${userId} from ${summaryUrl}: ${response.data.balance}`);
      return response.data.balance;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      if (error.isAxiosError) {
        this.logger.error(
          `GoalsService: AxiosError fetching balance for user ${userId} from ${summaryUrl}: ${errorMessage} (Status: ${error.response?.status})`,
           error.config?.url
        );
      } else {
         this.logger.error(
          `GoalsService: Error fetching balance for user ${userId} from ${summaryUrl}: ${errorMessage}`,
           error.stack
        );
      }
      throw new InternalServerErrorException(`Could not fetch user balance for user ${userId}. Service: [${summaryUrl}]. Details: ${errorMessage}`);
    }
  }

  private enrichGoalWithBalance(goal: Goal, currentBalance: number): Goal {
    const enrichedGoal = { ...goal }; 
    enrichedGoal.currentAmount = currentBalance;

    if (currentBalance >= enrichedGoal.targetAmount) {
      enrichedGoal.status = GoalStatus.COMPLETED;
    } else {
      if (enrichedGoal.status === GoalStatus.COMPLETED && currentBalance < enrichedGoal.targetAmount) {
        enrichedGoal.status = GoalStatus.IN_PROGRESS;
      } else if (enrichedGoal.status !== GoalStatus.FAILED) { 
         enrichedGoal.status = GoalStatus.IN_PROGRESS;
      }
    }
    this.logger.debug(`Enriched goal ${goal.id}: balance=${currentBalance}, target=${enrichedGoal.targetAmount}, currentAmount (dynamic)=${enrichedGoal.currentAmount}, newStatus=${enrichedGoal.status}`);
    return enrichedGoal;
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
      await this.processTransactionEventStatusUpdate(eventData.userId);
    } catch (error) {
      this.logger.error(`Error processing transaction_created event for user ${eventData.userId}: ${error.message}`, error.stack);
      return new Nack(true);
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
      await this.processTransactionEventStatusUpdate(eventData.userId);
    } catch (error) {
      this.logger.error(`Error processing transaction_deleted event for user ${eventData.userId}: ${error.message}`, error.stack);
      return new Nack(true); 
    }
  }

  async processTransactionEventStatusUpdate(eventUserId: string) {
    this.logger.log(`GoalService: Processing status update for goals of user ${eventUserId} due to transaction event.`);
    
    let currentBalance: number;
    try {
        currentBalance = await this.getUserBalance(eventUserId);
    } catch (error) {
        this.logger.error(`Failed to get user balance in processTransactionEventStatusUpdate for user ${eventUserId}. Aborting status update for goals. Error: ${error.message}`);
        return; 
    }
    
    const goalsToConsider = await this.goalRepository.find({
      where: [
        { userId: eventUserId, status: GoalStatus.IN_PROGRESS },
        { userId: eventUserId, status: GoalStatus.COMPLETED },
      ],
    });

    if (goalsToConsider.length === 0) {
      this.logger.log(`GoalService: No IN_PROGRESS or COMPLETED goals found for user ${eventUserId} to update status.`);
      return;
    }

    for (const goal of goalsToConsider) {
      const originalStatus = goal.status;
      const tempEnrichedGoal = this.enrichGoalWithBalance({ ...goal }, currentBalance);

      if (tempEnrichedGoal.status !== originalStatus) {
        this.logger.log(`Status change detected for goal ${goal.id} (user ${eventUserId}): from ${originalStatus} to ${tempEnrichedGoal.status}. Current balance: ${currentBalance}, target: ${goal.targetAmount}`);
        goal.status = tempEnrichedGoal.status;
        await this.goalRepository.save(goal); 
        this.logger.log(`Goal "${goal.goalName}" (ID: ${goal.id}) for user ${eventUserId} status updated to ${goal.status}.`);
      } else {
        this.logger.debug(`No status change for goal ${goal.id} (user ${eventUserId}). Status remains ${originalStatus}. Balance: ${currentBalance}, Target: ${goal.targetAmount}`);
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
      targetAmount: Number(createGoalDto.targetAmount),
      currentAmount: 0, 
      deadline: deadlineDate,
      status: createGoalDto.status ?? GoalStatus.IN_PROGRESS, 
    };
    const newGoal = this.goalRepository.create(newGoalEntityData);
    let savedGoal = await this.goalRepository.save(newGoal);
    this.logger.log(`Created goal ${savedGoal.id} for user ${callingUserId} with target ${savedGoal.targetAmount}. Initial persisted currentAmount: 0`);
    
    let currentBalance: number;
    try {
        currentBalance = await this.getUserBalance(callingUserId);
    } catch (error) {
        this.logger.error(`Failed to get user balance after creating goal ${savedGoal.id} for user ${callingUserId}. Returning goal with persisted values. Error: ${error.message}`);
        return { ...savedGoal, currentAmount: 0 }; 
    }
    
    const statusEnrichedGoal = this.enrichGoalWithBalance({ ...savedGoal }, currentBalance);
    if (statusEnrichedGoal.status !== savedGoal.status) {
        this.logger.log(`Updating status for newly created goal ${savedGoal.id} from ${savedGoal.status} to ${statusEnrichedGoal.status} based on balance ${currentBalance}`);
        savedGoal.status = statusEnrichedGoal.status;
        savedGoal = await this.goalRepository.save(savedGoal);
    }
    
    return this.enrichGoalWithBalance(savedGoal, currentBalance);
  }

  async findAllByUserId(userId: string): Promise<Goal[]> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided to retrieve goals.');
    }
    this.logger.log(`Finding all goals for user ${userId}`);
    const goalsFromDb = await this.goalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (goalsFromDb.length === 0) {
        this.logger.log(`No goals found in DB for user ${userId}`);
        return [];
    }
    this.logger.log(`Found ${goalsFromDb.length} goals in DB for user ${userId}. Fetching balance...`);

    let currentBalance: number;
    try {
        currentBalance = await this.getUserBalance(userId);
    } catch (error) {
        this.logger.error(`Failed to get user balance for user ${userId} in findAllByUserId. Returning goals with persisted currentAmount. Error: ${error.message}`);
        return goalsFromDb.map(goal => ({ ...goal })); 
    }
    
    this.logger.log(`Balance ${currentBalance} for user ${userId}. Enriching ${goalsFromDb.length} goals.`);
    return goalsFromDb.map(goal => {
        const enriched = this.enrichGoalWithBalance({ ...goal }, currentBalance);
        this.logger.debug(`Goal ${goal.id} (DB amount: ${goal.currentAmount}, DB status: ${goal.status}) -> Enriched amount: ${enriched.currentAmount}, Enriched status: ${enriched.status}`);
        return enriched;
    });
  }

  async findOneByIdAndUserId(goalId: string, userId: string): Promise<Goal> {
    if (!userId) throw new ForbiddenException('User ID must be provided for this operation.');
    if (!goalId) throw new BadRequestException('Goal ID must be provided.');
    
    this.logger.log(`Finding goal ${goalId} for user ${userId}`);
    const goalFromDb = await this.goalRepository.findOne({ where: { id: goalId, userId } });
    if (!goalFromDb) {
      this.logger.warn(`Goal ${goalId} not found in DB for user ${userId}`);
      throw new NotFoundException(
        `Goal with ID "${goalId}" not found or does not belong to user "${userId}".`,
      );
    }
    this.logger.log(`Found goal ${goalId} in DB for user ${userId}. Fetching balance...`);

    let currentBalance: number;
    try {
        currentBalance = await this.getUserBalance(userId);
    } catch (error) {
        this.logger.error(`Failed to get user balance for user ${userId} in findOneByIdAndUserId (goal ${goalId}). Returning goal with persisted currentAmount. Error: ${error.message}`);
        return { ...goalFromDb };
    }
    
    this.logger.log(`Balance ${currentBalance} for user ${userId}. Enriching goal ${goalId}.`);
    const enriched = this.enrichGoalWithBalance({ ...goalFromDb }, currentBalance);
    return enriched;
  }

  async update(
    goalId: string,
    userId: string,
    updateGoalDto: UpdateGoalDto,
  ): Promise<Goal> {
    this.logger.log(`Updating goal ${goalId} for user ${userId} with DTO: ${JSON.stringify(updateGoalDto)}`);
    let goal = await this.goalRepository.findOne({ where: { id: goalId, userId } });
    if (!goal) {
        this.logger.warn(`Goal ${goalId} not found for update (user ${userId})`);
        throw new NotFoundException(`Goal with ID "${goalId}" not found.`);
    }

    if (updateGoalDto.goalName !== undefined) goal.goalName = updateGoalDto.goalName;
    if (updateGoalDto.targetAmount !== undefined) goal.targetAmount = Number(updateGoalDto.targetAmount);
    
    if (updateGoalDto.deadline !== undefined) {
      const deadlineDate = new Date(updateGoalDto.deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new BadRequestException('Invalid deadline date format for update.');
      }
      goal.deadline = deadlineDate;
    }
    if (updateGoalDto.status !== undefined) goal.status = updateGoalDto.status;

    if (updateGoalDto.currentAmount !== undefined) {
        this.logger.warn(`Attempted to update currentAmount directly for goal ${goalId} via DTO. This direct update of currentAmount in DB is ignored, it's determined by balance.`);
    }
    
    this.logger.log(`Goal ${goalId} fields updated from DTO. Target: ${goal.targetAmount}, Name: ${goal.goalName}, Explicit Status: ${goal.status}`);

    let currentBalance: number;
    try {
        currentBalance = await this.getUserBalance(userId);
    } catch (error) {
        this.logger.error(`Failed to get user balance for user ${userId} while updating goal ${goalId}. Saving goal with DTO changes only (status might be inaccurate). Error: ${error.message}`);
        const updatedGoalWithoutBalanceCheck = await this.goalRepository.save(goal);
        return { ...updatedGoalWithoutBalanceCheck, currentAmount: updatedGoalWithoutBalanceCheck.currentAmount };
    }
    
    const finalEnrichedGoal = this.enrichGoalWithBalance(goal, currentBalance); 
    goal.status = finalEnrichedGoal.status;

    this.logger.log(`Saving updated goal ${goalId} with new status ${goal.status} (derived from balance ${currentBalance})`);
    let updatedGoalFromDb = await this.goalRepository.save(goal); 
    
    return this.enrichGoalWithBalance(updatedGoalFromDb, currentBalance);
  }

  async remove(goalId: string, userId: string): Promise<void> {
    this.logger.log(`Removing goal ${goalId} for user ${userId}`);
    const goal = await this.goalRepository.findOne({ where: { id: goalId, userId } });
    if (!goal) {
        this.logger.warn(`Goal ${goalId} not found for removal (user ${userId})`);
        throw new NotFoundException(`Goal with ID "${goalId}" not found or does not belong to user "${userId}".`);
    }
    const result = await this.goalRepository.delete({ id: goalId, userId });
    if (result.affected === 0) {
      this.logger.error(`Failed to delete goal ${goalId} for user ${userId}, affected rows is 0.`);
      throw new NotFoundException(
        `Goal with ID "${goalId}" could not be deleted.`,
      );
    }
    this.logger.log(`Successfully removed goal ${goalId} for user ${userId}`);
  }
}