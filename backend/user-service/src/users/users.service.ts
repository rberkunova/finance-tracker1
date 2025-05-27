// backend/user-service/src/users/users.service.ts
import {
  Injectable,
  HttpException,
  NotFoundException,
  ConflictException,
  HttpStatus,
  UnauthorizedException, // Використовуємо стандартну помилку NestJS
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity'; // Ваш клас сутності User
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

// Визначимо типи, які буде повертати сервіс і використовувати контролер
export interface LoginResult {
  token: string;
  user: Omit<User, 'password'>; // Повертаємо користувача без пароля
}

export interface UsersAndCount {
  users: Omit<User, 'password'>[]; // Повертаємо користувачів без паролів
  count: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Перейменовано repo для ясності
    private readonly jwtService: JwtService, // Перейменовано jwt для ясності
  ) {}

  async createUser(name: string, email: string, passwordInput: string): Promise<User> { // password перейменовано на passwordInput
    const hashedPassword = await bcrypt.hash(passwordInput, 10);
    try {
      const user = this.userRepository.create({ name, email, password: hashedPassword });
      return await this.userRepository.save(user);
      // Пароль буде видалено у контролері перед відправкою клієнту
    } catch (err: unknown) {
      if (
        err instanceof QueryFailedError &&
        (err as any).code === '23505' // PostgreSQL unique_violation for email
      ) {
        throw new ConflictException('Email already taken');
      }
      // Логування помилки може бути корисним тут
      console.error('Error creating user:', err);
      throw new HttpException('Could not create user.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(email: string, pass: string): Promise<LoginResult> {
    const userEntity = await this.userRepository.findOne({ where: { email } });
    if (!userEntity) {
      throw new UnauthorizedException('Invalid credentials'); // Більш загальне повідомлення
    }

    const isPasswordMatching = await bcrypt.compare(pass, userEntity.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: userEntity.id, email: userEntity.email, name: userEntity.name };
    const token = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = userEntity;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async findAll(query: PaginationQueryDto): Promise<UsersAndCount> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [users, count] = await this.userRepository.findAndCount({
      where: {}, // Додайте фільтри, якщо потрібно
      // withDeleted: false, // Це для softDelete, якщо використовується
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      // select: { password: false } // TypeORM не дозволяє select:false, паролі треба видаляти вручну
    });

    const usersWithoutPasswords = users.map(userEntity => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...user } = userEntity;
      return user;
    });
    
    return { users: usersWithoutPasswords, count };
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    if (!userEntity) {
      throw new NotFoundException('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = userEntity;
    return userWithoutPassword;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> { // Повертає повного User, пароль видаляється в контролері
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepository.exist({ where: { email: dto.email } });
      if (exists) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    // Object.assign(user, dto); // Це може бути небезпечно, якщо dto містить зайві поля
    // Краще оновлювати поля явно або використовувати spread з обережністю
    const updatedUser = this.userRepository.merge(user, dto);
    return this.userRepository.save(updatedUser);
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const result = await this.userRepository.delete(id); // Використовуємо delete замість softDelete, якщо не налаштовано
    // const result = await this.userRepository.softDelete(id); // Якщо використовується soft delete

    if (result.affected === 0) {
      throw new NotFoundException('User not found or already deleted');
    }
    return { deleted: true, message: 'User successfully deleted' };
  }
}