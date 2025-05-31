import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UserId } from '../auth/decorators/user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { Wish } from './entities/wish.entity';
import { WishesService } from './wishes.service';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createWishDto: CreateWishDto,
    @Req() req: { user: User },
  ): Promise<Wish> {
    return this.wishesService.create(createWishDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async find() {
    return this.wishesService.findMany();
  }

  @Get('last')
  async findLast() {
    return this.wishesService.findLast(40);
  }

  @Get('top')
  async findTop() {
    return this.wishesService.findTop(20);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: number) {
    return this.wishesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: number,
    @Body() updateWishDto: UpdateWishDto,
    @UserId() userId: number,
  ): Promise<Wish | null> {
    return this.wishesService.update(id, updateWishDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  removeOne(@Param('id') id: number, @UserId() userId: number): Promise<Wish> {
    return this.wishesService.remove(id, userId);
  }

  @Post(':id/copy')
  @UseGuards(JwtAuthGuard)
  async copyWish(@Param('id') id: number, @Req() req: { user: User }) {
    if (req.user) {
      return this.wishesService.copyWish(id, req.user);
    }
  }
}
