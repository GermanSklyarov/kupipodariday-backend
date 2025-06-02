import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { Wish } from './entities/wish.entity';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishesRepository: Repository<Wish>,
  ) {}

  async create(createWishDto: CreateWishDto, user: User): Promise<Wish> {
    const wishDto = plainToInstance(CreateWishDto, createWishDto);
    const errors = await validate(wishDto);

    if (errors.length > 0) {
      throw new BadRequestException(
        `Validation failed: ${errors.map((error) => Object.values(error.constraints || '')).join(', ')}`,
      );
    }
    const wish = this.wishesRepository.create({
      ...createWishDto,
      owner: user,
    });
    return await this.wishesRepository.save(wish);
  }

  async findOne(id: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });

    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }

    return instanceToPlain(wish);
  }

  async findMany() {
    const wishes = await this.wishesRepository.find({
      relations: ['owner', 'offers'],
    });
    return wishes.map((wish) => instanceToPlain(wish));
  }

  async findWishesByUserId(userId: number) {
    const wishes = await this.wishesRepository.find({
      where: { owner: { id: userId } },
      relations: ['owner', 'offers'],
    });
    return wishes.map((wish) => instanceToPlain(wish));
  }

  async findLast(take: number) {
    const wishes = await this.wishesRepository.find({
      order: { createdAt: 'DESC' },
      take,
      relations: ['owner', 'offers'],
    });
    return wishes.map((wish) => instanceToPlain(wish));
  }

  async findTop(take: number) {
    const wishes = await this.wishesRepository.find({
      order: { copied: 'DESC' },
      take,
      relations: ['owner', 'offers'],
    });
    return wishes.map((wish) => instanceToPlain(wish));
  }

  async update(
    id: number,
    updateWishDto: UpdateWishDto,
    userId: number,
  ): Promise<Wish> {
    const wishPlain = await this.findOne(id);
    const wish = plainToInstance(Wish, wishPlain);

    if (wish.owner.id !== userId) {
      throw new ForbiddenException(
        'Вы можете редактировать только свои подарки',
      );
    }

    if (
      wish.offers &&
      wish.offers.length > 0 &&
      updateWishDto.price !== undefined
    ) {
      throw new ForbiddenException(
        'Нельзя изменять стоимость, если есть желающие',
      );
    }

    const updatedWish = { ...wish, ...updateWishDto };
    const errors = await validate(updatedWish);
    if (errors.length > 0) {
      throw new BadRequestException(
        `Validation failed: ${errors.map((error) => Object.values(error.constraints || '')).join(', ')}`,
      );
    }

    return await this.wishesRepository.save(updatedWish);
  }

  async increaseWishCopied(id: number) {
    const wishPlain = await this.findOne(id);
    const wish = plainToInstance(Wish, wishPlain);
    wish.copied++;
    return this.wishesRepository.save(wish);
  }

  async copyWish(id: number, user: User) {
    const wishPlain = await this.findOne(id);
    const wish = plainToInstance(Wish, wishPlain);
    if (wish.owner.id === user.id) {
      throw new ForbiddenException('Нельзя копировать свой подарок');
    }

    const existingCopy = await this.wishesRepository.findOne({
      where: {
        owner: { id: user.id },
        name: wish.name,
        link: wish.link,
        image: wish.image,
        price: +wish.price,
        description: wish.description,
      },
    });

    if (existingCopy) {
      throw new BadRequestException('Вы уже копировали себе такой подарок');
    }

    const copiedWish = await this.create(
      {
        name: wish.name,
        link: wish.link,
        image: wish.image,
        price: +wish.price,
        description: wish.description,
      },
      user,
    );

    await this.increaseWishCopied(wish.id);

    return copiedWish;
  }

  async remove(id: number, userId: number): Promise<Wish> {
    const wish = await this.wishesRepository.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });

    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои подарки');
    }

    if (wish.offers && wish.offers.length > 0) {
      throw new ForbiddenException(
        'Нельзя удалять подарок, если есть желающие',
      );
    }

    return this.wishesRepository.remove(wish);
  }
}
