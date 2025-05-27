// backend/goal-service/src/goals/dto/create-goal.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min, IsDateString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { GoalStatus } from '../entities/goal.entity';

export class CreateGoalDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string; // Фронтенд має передавати ID користувача, який створює ціль

  @IsString()
  @IsNotEmpty()
  goalName: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  targetAmount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  currentAmount?: number = 0;

  @IsDateString() // Рядок у форматі ISO 8601 (YYYY-MM-DD)
  @IsNotEmpty()
  deadline: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus = GoalStatus.IN_PROGRESS;
}
