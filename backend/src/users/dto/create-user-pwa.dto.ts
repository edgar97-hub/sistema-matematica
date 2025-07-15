import { IsString, IsEmail, IsUrl, IsOptional } from 'class-validator';

export class CreateUserPwaDto {
  @IsString()
  googleId: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsUrl()
  @IsOptional()
  pictureUrl?: string;
}