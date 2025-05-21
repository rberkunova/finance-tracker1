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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.users.createUser(dto.name, dto.email, dto.password);
    // повертаємо JSON із полем user
    return {
      status: 'success',
      user,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const token = await this.users.login(dto.email, dto.password);
    return {
      status: 'success',
      token,
    };
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const users = await this.users.findAll(query);
    return {
      status: 'success',
      results: users.length,
      users,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.users.findOne(id);
    return {
      status: 'success',
      user,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.users.update(id, dto);
    return {
      status: 'success',
      user,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.users.remove(id);
    return {
      status: 'success',
      message: 'User deleted',
    };
  }
}