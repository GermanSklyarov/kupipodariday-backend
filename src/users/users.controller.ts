import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WishesService } from 'src/wishes/wishes.service';
import { UserId } from '../auth/decorators/user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly wishesService: WishesService,
  ) {}

  @Get('me')
  findOwn(@UserId() userId: number): Promise<User> {
    return this.usersService.findOne({ id: userId });
  }

  @Get(':username')
  async findOne(@Param('username') username: string) {
    const user = await this.usersService.findOne({ username });
    const publicData: Partial<User> = { ...user };
    delete publicData.email;
    delete publicData.password;
    return publicData;
  }

  @Get('me/wishes')
  async getOwnWishes(@UserId() userId: number) {
    const wishes = await this.wishesService.findWishesByUserId(userId);
    if (!wishes) {
      throw new NotFoundException('Подарки не найдены');
    }
    return wishes;
  }

  @Get(':username/wishes')
  async getWishes(@Param('username') username: string) {
    const user = await this.usersService.findOne({ username });
    return await this.wishesService.findWishesByUserId(user.id);
  }

  @Post('find')
  async findMany(@Body() body: { query: string }) {
    const users = await this.usersService.findMany(body.query);
    return users.map((user) => {
      const publicData: Partial<User> = { ...user };
      delete publicData.email;
      delete publicData.password;
      return publicData;
    });
  }

  @Patch('me')
  update(
    @UserId() userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    return this.usersService.updateOne(userId, updateUserDto);
  }
}
