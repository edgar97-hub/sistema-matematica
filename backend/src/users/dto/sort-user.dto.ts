import { IsOptional, IsString, IsIn } from 'class-validator';

export class SortUserDto {
  @IsOptional()
  @IsString()
  // Asegúrate que los valores aquí coincidan con los 'id' de columna que la tabla puede ordenar
  @IsIn([
    'createdAt',
    'name',
    'email',
    'credits',
    'countryOfOrigin',
    'isActive',
  ])
  field?: string; // Recibido como query param 'field'

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  direction?: 'ASC' | 'DESC'; // Recibido como query param 'direction'
}
