import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserPwaProfileDto {
  @IsNotEmpty()
  @IsString()
  countryOfOrigin: string;
}