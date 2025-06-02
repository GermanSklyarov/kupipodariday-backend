import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_KEY || 'jwt_secret',
    });
  }

  async validate(payload: { username: string }) {
    const user = await this.usersService.findOne({
      username: payload.username,
    });

    if (!user) {
      throw new UnauthorizedException('У вас нет доступа');
    }

    const publicData: Partial<User> = { ...user };
    delete publicData.email;
    delete publicData.password;
    return publicData;
  }
}
