import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { UsersService } from './users.service';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { FilterUserDto } from '../dto/filter-user.dto';
import { SortUserDto } from '../dto/sort-user.dto';
import { CreateUserPwaDto } from '../dto/create-user-pwa.dto';
import { UpdateUserByAdminDto } from '../dto/update-user-by-admin.dto';
import { UpdateUserPwaProfileDto } from '../dto/update-user-pwa-profile.dto';
import { User } from '../decorators/user.decorator';
import { FindAllUsersQueryDto } from '../dto/FindAllUsersQueryDto.dto';

@Controller('users')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { ttl: 1000, limit: 3 } })
  async create(@Body() createUserDto: CreateUserPwaDto) {
    try {
      return await this.usersService.create(createUserDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Throttle({ medium: { ttl: 10000, limit: 20 } })
  async findAll(@Query() queryDto: FindAllUsersQueryDto) {
    try {
      return await this.usersService.findAll(queryDto);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Throttle({ short: { ttl: 1000, limit: 5 } })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.usersService.findById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve user');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Throttle({ short: { ttl: 1000, limit: 3 } })
  async updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserByAdminDto: UpdateUserByAdminDto,
  ) {
    try {
      return await this.usersService.updateByAdmin(id, updateUserByAdminDto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update user');
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { ttl: 10000, limit: 10 } })
  async getProfile(@User() user) {
    try {
      return await this.usersService.findById(user.id);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve user profile');
    }
  }

  @Patch('update-by-user/profile')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 3 } })
  async updateProfileByUserStandar(
    @User() user,
    @Body() updateProfileDto: UpdateUserPwaProfileDto,
  ) {
    try {
      return await this.usersService.updateProfileByUserStandar(
        user.id,
        updateProfileDto,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update user profile');
    }
  }

  @Patch(':id/email')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Throttle({ short: { ttl: 1000, limit: 3 } })
  async updateEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body('email') email: string,
  ) {
    try {
      return await this.usersService.updateEmail(id, email);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update user email');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { ttl: 1000, limit: 3 } })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.usersService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove user');
    }
  }
}
