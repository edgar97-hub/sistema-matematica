import { IsOptional, IsString, MaxLength, IsArray } from 'class-validator';

export class UpdateExerciseDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto.' })
  @MaxLength(255, {
    message: 'El título no puede tener más de 255 caracteres.',
  })
  title?: string;

  @IsString()
  @IsOptional()
  enunciadoLatexOriginal?: string;

  @IsString()
  @IsOptional()
  enunciadoLatexNormalizado?: string;

  @IsString()
  @IsOptional()
  ngrams?: string;

  // @IsArray({ message: 'Tags must be an array test' })
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
