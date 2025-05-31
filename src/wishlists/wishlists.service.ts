import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { Wishlist } from './entities/wishlist.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistsRepository: Repository<Wishlist>,
  ) {}

  async create(
    createWishlistDto: CreateWishlistDto,
    user: User,
  ): Promise<Wishlist> {
    const wishlistDto = plainToInstance(CreateWishlistDto, createWishlistDto);
    const errors = await validate(wishlistDto);
    if (errors.length > 0) {
      throw new BadRequestException(
        `Validation failed: ${errors.map((error) => Object.values(error.constraints || '')).join(', ')}`,
      );
    }

    const wishlist = this.wishlistsRepository.create({
      ...createWishlistDto,
      owner: user,
      items: createWishlistDto.itemsId.map((itemId) => ({ id: itemId })),
    });
    return await this.wishlistsRepository.save(wishlist);
  }

  async findOne(id: number): Promise<Wishlist> {
    const wishlist = await this.wishlistsRepository.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });
    if (!wishlist) {
      throw new NotFoundException('Вишлист не найден');
    }
    return wishlist;
  }

  async findMany(): Promise<Wishlist[]> {
    return await this.wishlistsRepository.find({
      relations: ['owner', 'items'],
    });
  }

  async update(
    id: number,
    updateWishlistDto: UpdateWishlistDto,
    userId: number,
  ): Promise<Wishlist> {
    const wishlist = await this.findOne(id);

    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException(
        'Вы можете редактировать только свои вишлисты',
      );
    }

    const updatedWishlist = plainToInstance(Wishlist, {
      ...wishlist,
      ...updateWishlistDto,
    });
    const errors = await validate(updatedWishlist);
    if (errors.length > 0) {
      throw new BadRequestException(
        `Validation failed: ${errors.map((error) => Object.values(error.constraints || '')).join(', ')}`,
      );
    }

    return this.wishlistsRepository.save({ ...wishlist, ...updateWishlistDto });
  }

  async remove(id: number, userId: number): Promise<Wishlist> {
    const wishlist = await this.findOne(id);
    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои вишлисты');
    }
    return this.wishlistsRepository.remove(wishlist);
  }
}
