import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AdminRole } from '../enums/admin-role.enum';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminUserRepository: Repository<AdminUserEntity>,
  ) {}

  async findByUsername(username: string): Promise<AdminUserEntity | null> {
    return this.adminUserRepository.findOne({
      where: { username, isActive: true },
    });
  }

  async findById(id: number): Promise<AdminUserEntity | null> {
    return this.adminUserRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async create(adminUserData: {
    username: string;
    password: string;
    email: string;
    name: string;
    role?: AdminRole;
  }): Promise<AdminUserEntity> {
    const adminUser = this.adminUserRepository.create({
      ...adminUserData,
      role: adminUserData.role || AdminRole.ADMINISTRATOR,
    });

    return this.adminUserRepository.save(adminUser);
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<AdminUserEntity | null> {
    const user = await this.findByUsername(username);
    if (user && (await user.validatePassword(password))) {
      return user;
    }
    return null;
  }

  async findAll(): Promise<AdminUserEntity[]> {
    return this.adminUserRepository.find({
      where: { isActive: true },
      select: [
        'id',
        'username',
        'email',
        'name',
        'role',
        'createdAt',
        'updatedAt',
      ],
    });
  }
}
