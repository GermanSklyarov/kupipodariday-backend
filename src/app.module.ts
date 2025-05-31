import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { Base } from './entities/base.entity';
import { HashingModule } from './hashing/hashing.module';
import { Offer } from './offers/entities/offer.entity';
import { OffersModule } from './offers/offers.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { Wish } from './wishes/entities/wish.entity';
import { WishesModule } from './wishes/wishes.module';
import { Wishlist } from './wishlists/entities/wishlist.entity';
import { WishlistsModule } from './wishlists/wishlists.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'student',
      password: 'student',
      database: 'kupipodariday',
      entities: [Base, User, Wish, Wishlist, Offer],
      synchronize: true,
    }),
    UsersModule,
    WishesModule,
    WishlistsModule,
    OffersModule,
    HashingModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
