import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @IsNotEmpty()
  // @Length(1, 100, {
  //   message: 'El nombre del país debe tener entre 1 y 100 caracteres',
  // })
  name: string;

  // @IsString()
  // @IsOptional()
  // // @Length(3, 3, { message: 'El código del país debe tener exactamente 3 caracteres' })
  // // @Matches(/^[A-Z]{3}$/, {
  // //   message: 'El código del país debe ser de 3 letras mayúsculas',
  // // })
  // code: string;

  // @IsString()
  // @IsOptional()
  // @Length(0, 255, {
  //   message: 'La URL de la bandera no debe exceder los 255 caracteres',
  // })
  // flag_url?: string;

  // @IsBoolean()
  // @IsOptional()
  // is_active?: boolean;
}

export class UpdateCountryDto {
  @IsString()
  @IsOptional()
  // @Length(1, 100, {
  //   message: 'El nombre del país debe tener entre 1 y 100 caracteres',
  // })
  name?: string;

  @IsString()
  @IsOptional()
  // @Length(3, 3, { message: 'El código del país debe tener exactamente 3 caracteres' })
  // @Matches(/^[A-Z]{3}$/, {
  //   message: 'El código del país debe ser de 3 letras mayúsculas',
  // })
  code?: string;

  @IsString()
  @IsOptional()
  @Length(0, 255, {
    message: 'La URL de la bandera no debe exceder los 255 caracteres',
  })
  flag_url?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
