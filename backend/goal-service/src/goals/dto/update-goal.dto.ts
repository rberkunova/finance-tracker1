// backend/goal-service/src/goals/dto/update-goal.dto.ts
import { IsString, IsOptional, IsNumber, Min, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { GoalStatus } from '../entities/goal.entity';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  goalName?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  targetAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}
