// backend/goal-service/src/goals/goals.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Goal } from './entities/goal.entity';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Приклад вашого AuthGuard
// interface AuthenticatedRequest extends Request { user: { id: string; /* ...інші поля user */ } } // Приклад

@Controller('api/goals')
// @UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    // @Req() req: AuthenticatedRequest, // Розкоментуйте, коли буде AuthGuard
    @Body() createGoalDto: CreateGoalDto,
  ): Promise<Goal> {
    // const callingUserId = req.user.id; // Отримання userId з токена (після налаштування AuthGuard)
    
    // ТИМЧАСОВО: Якщо userId передається в DTO і ми довіряємо йому на цьому етапі,
    // або якщо callingUserId має бути тим самим, що й у DTO
    const callingUserId = createGoalDto.userId; // Використовуємо userId з DTO як ідентифікатор викликаючого користувача

    // Перевірка, чи userId в DTO збігається з тим, хто робить запит (якщо б ми мали req.user.id)
    // if (createGoalDto.userId !== callingUserId) {
    //   throw new ForbiddenException("You can only create goals for yourself.");
    // }
    return this.goalsService.create(createGoalDto, callingUserId); // <--- Тепер передаємо другий аргумент
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async findAllByUserId(
    @Param('userId', ParseUUIDPipe) userIdParam: string,
    // @Req() req: AuthenticatedRequest,
  ): Promise<Goal[]> {
    // const callingUserId = req.user.id;
    // if (userIdParam !== callingUserId /* && !req.user.isAdmin */) { // Дозволити тільки свої або адміну
    //   throw new ForbiddenException("You can only view your own goals.");
    // }
    return this.goalsService.findAllByUserId(userIdParam);
  }

  @Get(':goalId/user/:userId')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('userId', ParseUUIDPipe) userIdFromParam: string,
    // @Req() req: AuthenticatedRequest,
  ): Promise<Goal> {
    // const callingUserId = req.user.id;
    // if (userIdFromParam !== callingUserId) {
    //   throw new ForbiddenException("You can only view your own goals.");
    // }
    return this.goalsService.findOneByIdAndUserId(goalId, userIdFromParam);
  }

  @Put(':goalId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    // @Req() req: AuthenticatedRequest,
    @Body() updateGoalDto: UpdateGoalDto,
  ): Promise<Goal> {
    // const callingUserId = req.user.id;
    const DUMMY_CALLING_USER_ID = '03c73555-77c7-4037-90e8-f0316862f8a7'; // ЗАГЛУШКА! ЗАМІНИТИ!
    return this.goalsService.update(goalId, DUMMY_CALLING_USER_ID, updateGoalDto);
  }

  @Delete(':goalId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('goalId', ParseUUIDPipe) goalId: string,
    // @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    // const callingUserId = req.user.id;
    const DUMMY_CALLING_USER_ID = '03c73555-77c7-4037-90e8-f0316862f8a7'; // ЗАГЛУШКА! ЗАМІНИТИ!
    await this.goalsService.remove(goalId, DUMMY_CALLING_USER_ID);
  }
}