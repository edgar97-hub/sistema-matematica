import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';

export class CreateExerciseDto {
  @IsString({ message: 'El título debe ser un texto.' })
  @IsNotEmpty({ message: 'El título no puede estar vacío.' })
  @MaxLength(255, {
    message: 'El título no puede tener más de 255 caracteres.',
  })
  title: string;

  @IsString()
  @IsOptional()
  enunciadoLatexOriginal?: string;

  @IsString()
  @IsOptional()
  enunciadoLatexNormalizado?: string;

  @IsString()
  @IsOptional()
  ngrams?: string;

  // @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
