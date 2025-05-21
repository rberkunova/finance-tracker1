// backend/user-service/src/users/users.service.ts
import {
  Injectable,
  HttpException,
  NotFoundException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async createUser(name: string, email: string, password: string): Promise<User> {
    const hash = await bcrypt.hash(password, 10);
    try {
      const user = this.repo.create({ name, email, password: hash });
      return await this.repo.save(user);
    } catch (err: unknown) {
      if (
        err instanceof QueryFailedError &&
        // PostgreSQL unique_violation
        (err as any).code === '23505'
      ) {
        throw new HttpException('Email already taken', HttpStatus.CONFLICT);
      }
      throw err;
    }
  }

  async login(email: string, pass: string): Promise<string> {
    const user = await this.repo.findOne({ where: { email } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  async findAll(query: PaginationQueryDto): Promise<User[]> {
    // Гарантуємо числовий тип і дефолт
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;

    const skip = (page - 1) * limit;
    const take = limit;

    return this.repo.find({
      where: {},
      withDeleted: false,
      skip,
      take,
      order: { createdAt: 'DESC' },
      select: { password: false },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      select: { password: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.repo.exist({ where: { email: dto.email } });
      if (exists) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.repo.softDelete(id);
    if (!res.affected) {
      throw new NotFoundException('User not found');
    }
    return { deleted: true };
  }
}