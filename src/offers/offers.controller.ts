import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserId } from 'src/auth/decorators/user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  async create(
    @UserId() userId: number,
    @Body() createOfferDto: CreateOfferDto,
  ) {
    return await this.offersService.createOffer(userId, createOfferDto);
  }

  @Get()
  async findAll() {
    return this.offersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.offersService.findOne(id);
  }
}
