import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private hashingService: HashingService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userDto = plainToInstance(CreateUserDto, createUserDto);
    const errors = await validate(userDto);
    if (errors.length > 0) {
      throw new BadRequestException(
        `Validation failed: ${errors.map((error) => Object.values(error.constraints || '')).join(', ')}`,
      );
    }
    try {
      const user = this.usersRepository.create({
        ...createUserDto,
        about: createUserDto.about || 'Пока ничего не рассказал о себе',
        avatar: createUserDto.avatar || 'https://i.pravatar.cc/300',
      });
      const errors = await validate(user);
      if (errors.length > 0) {
        throw new BadRequestException(
          `Validation failed: ${errors.map((error) => Object.values(error.constraints || '')).join(', ')}`,
        );
      }
      return await this.usersRepository.save(user);
    } catch (err: unknown) {
      if (this.isDatabaseError(err) && err.code === '23505') {
        throw new ConflictException(
          'Пользователь с такой почтой или именем уже зарегистрирован',
        );
      }
      throw err;
    }
  }

  isDatabaseError(err: unknown): err is { code: string } {
    return typeof err === 'object' && err !== null && 'code' in err;
  }

  async findOne(conditions: Partial<User>): Promise<User> {
    const user = await this.usersRepository.findOneBy(conditions);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string) {
    return await this.usersRepository.findOneBy({
      username,
    });
  }

  async findMany(query: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .orWhere('user.email ILIKE :query', { query: `%${query}%` })
      .getMany();
  }

  async updateOne(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = plainToInstance(User, { ...user, ...updateUserDto });
    const errors = await validate(updatedUser);
    if (errors.length > 0) {
      throw new BadRequestException(
        `Validation failed: ${errors.map((error) => Object.values(error.constraints || '')).join(', ')}`,
      );
    }

    Object.assign(user, updateUserDto);

    if (updateUserDto.password) {
      user.password = await this.hashingService.hashPassword(
        updateUserDto.password,
      );
    }

    try {
      return await this.usersRepository.save(user);
    } catch (err: unknown) {
      if (this.isDatabaseError(err) && err.code === '23505') {
        throw new ConflictException(
          'Пользователь с такой почтой или именем уже зарегистрирован',
        );
      }
      throw err;
    }
  }

  async removeOne(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
