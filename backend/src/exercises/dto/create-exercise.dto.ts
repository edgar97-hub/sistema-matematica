import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateExerciseDto {
  @IsString({ message: 'El título debe ser un texto.' })
  @IsNotEmpty({ message: 'El título no puede estar vacío.' })
  @MaxLength(255, { message: 'El título no puede tener más de 255 caracteres.' })
  title: string;
}
