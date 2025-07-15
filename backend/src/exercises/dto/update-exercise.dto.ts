import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateExerciseDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto.' })
  @MaxLength(255, {
    message: 'El título no puede tener más de 255 caracteres.',
  })
  title?: string;
}
