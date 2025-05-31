import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateOfferDto {
  @IsNotEmpty()
  itemId: number;

  @IsNumber()
  amount: number;

  @IsBoolean()
  hidden?: boolean;
}
