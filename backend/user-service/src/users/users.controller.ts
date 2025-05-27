// backend/user-service/src/users/users.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Put,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService, LoginResult, UsersAndCount } from './users.service'; // Імпортуємо типи з сервісу
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { User } from './user.entity'; // Припускаємо, що User - це ваш тип/інтерфейс/клас сутності

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<{ status: string; user: Omit<User, 'password'> }> {
    const userEntity = await this.usersService.createUser(dto.name, dto.email, dto.password);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = userEntity;
    return {
      status: 'success',
      user: userWithoutPassword,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<{ status: string; token: string; user: Omit<User, 'password'> }> {
    const loginResult: LoginResult = await this.usersService.login(dto.email, dto.password);
    // usersService.login вже повертає user без пароля
    return {
      status: 'success',
      token: loginResult.token,
      user: loginResult.user, // loginResult.user вже не має пароля згідно з типом LoginResult
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginationQueryDto): Promise<{ status: string; count: number; results: number; users: Omit<User, 'password'>[] }> {
    const usersAndCount: UsersAndCount = await this.usersService.findAll(query);
    // usersService.findAll вже повертає користувачів без паролів
    return {
      status: 'success',
      count: usersAndCount.count,
      results: usersAndCount.users.length,
      users: usersAndCount.users,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<{ status: string; user: Omit<User, 'password'> }> {
    // usersService.findOne вже повертає користувача без пароля
    const userWithoutPassword = await this.usersService.findOne(id);
    return {
      status: 'success',
      user: userWithoutPassword,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<{ status: string; user: Omit<User, 'password'> }> {
    const updatedUserEntity = await this.usersService.update(id, dto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUserEntity;
    return {
      status: 'success',
      user: userWithoutPassword,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK) // Змінено на OK, оскільки повертаємо тіло з повідомленням
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ status: string; message: string; data: {deleted: boolean} }> {
    const result = await this.usersService.remove(id);
    return {
      status: 'success',
      message: 'User processed for deletion', // Уточнено повідомлення
      data: result,
    };
  }
}