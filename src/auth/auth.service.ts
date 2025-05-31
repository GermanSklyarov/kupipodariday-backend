import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../hashing/hashing.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private hashingService: HashingService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findOne({ username });
    const { password: userPassword, ...result } = user;
    if (await this.hashingService.verifyPassword(password, userPassword)) {
      return result;
    }
    return null;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await this.hashingService.hashPassword(
      createUserDto.password,
    );
    return this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  login(user: Partial<User>) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
