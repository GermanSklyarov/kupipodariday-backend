import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(2)
  password: string;

  @IsString()
  @Length(2, 30)
  username: string;

  @IsOptional()
  avatar?: string;

  @IsOptional()
  about?: string;
}
