import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Wish } from '../wishes/entities/wish.entity';
import { Repository } from 'typeorm';
import { WishesService } from '../wishes/wishes.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Offer } from './entities/offer.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offersRepository: Repository<Offer>,
    private readonly WishesService: WishesService,
  ) {}

  async canContribute(
    userId: number,
    itemId: number,
    amount: number,
  ): Promise<boolean> {
    const wishPlain = await this.WishesService.findOne(itemId);
    const wish = plainToInstance(Wish, wishPlain);

    if (!wish) return false;

    const currentRaised = wish.raised || 0;
    return currentRaised + amount <= wish.price && wish.owner.id !== userId;
  }

  async createOffer(
    userId: number,
    createOfferDto: CreateOfferDto,
  ): Promise<Offer> {
    const offerDto = plainToInstance(CreateOfferDto, createOfferDto);
    const errors = await validate(offerDto);
    if (errors.length > 0) {
      throw new BadRequestException(
        `Validation failed: ${errors.map((error) => Object.values(error.constraints || '')).join(', ')}`,
      );
    }
    const offer = this.offersRepository.create({
      user: { id: userId },
      item: { id: createOfferDto.itemId },
      amount: createOfferDto.amount,
      hidden: createOfferDto.hidden || false,
    });

    return this.offersRepository.save(offer);
  }

  async findAll(): Promise<Offer[]> {
    return this.offersRepository.find({ relations: ['user', 'item'] });
  }

  async findOne(id: number) {
    return this.offersRepository.findOne({
      where: { id },
      relations: ['user', 'item'],
    });
  }
}
