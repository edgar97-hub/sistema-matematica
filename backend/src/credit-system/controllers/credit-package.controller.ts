import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CreditPackageService } from '../services/credit-package.service';
import { CreateCreditPackageDto } from '../dto/create-credit-package.dto';
import { UpdateCreditPackageDto } from '../dto/update-credit-package.dto';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('credit-packages')
// @UseGuards(JwtAuthGuard, AdminGuard)
export class CreditPackageController {
  constructor(private readonly creditPackageService: CreditPackageService) {}

  @Post()
  create(@Body() createCreditPackageDto: CreateCreditPackageDto) {
    return this.creditPackageService.create(createCreditPackageDto);
  }

  @Get()
  findAll() {
    return this.creditPackageService.findAll();
  }

  @Get('users/active')
  findAllActives() {
    return this.creditPackageService.findAllActives();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditPackageService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCreditPackageDto: UpdateCreditPackageDto,
  ) {
    return this.creditPackageService.update(+id, updateCreditPackageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creditPackageService.remove(+id);
  }
}
