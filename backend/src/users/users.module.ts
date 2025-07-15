import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { UserEntity } from './entities/user.entity';
import { EducationalContentModule } from '../educational-content/educational-content.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    EducationalContentModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
