import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
export class FilterUserDto {
  @IsOptional()
  @IsString()
  email?: string; // Recibido como query param 'email'

  @IsOptional()
  @IsString()
  name?: string; // Recibido como query param 'name'

  @IsOptional()
  // @IsBoolean() // class-validator espera un booleano real si se usa directamente
  @Transform(({ value }) => {
    // Transformar string 'true'/'false' a booleano
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined; // o el valor original si quieres manejar otros tipos
  })
  isActive?: boolean; // Recibido como query param 'isActive'

  @IsOptional()
  @IsString()
  countryOfOrigin?: string; // Recibido como query param 'countryOfOrigin'
}
