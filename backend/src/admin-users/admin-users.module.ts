import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersService } from './admin-users/admin-users.service';
import { AdminUsersController } from './admin-users/admin-users.controller';
import { AdminUserEntity } from './entities/admin-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUserEntity])],
  providers: [AdminUsersService],
  controllers: [AdminUsersController],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
