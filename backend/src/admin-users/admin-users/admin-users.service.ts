import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AdminRole } from '../enums/admin-role.enum';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminUserRepository: Repository<AdminUserEntity>,
  ) {}

  async findByUsername(username: string): Promise<AdminUserEntity | null> {
    return this.adminUserRepository.findOne({
      where: {
        username,
        // isActive: true
      },
    });
  }

  async findById(id: number): Promise<AdminUserEntity | null> {
    return this.adminUserRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async create(
    createAdminUserDto: CreateAdminUserDto,
  ): Promise<AdminUserEntity> {
    const existingUser = await this.findByUsername(createAdminUserDto.username);
    if (existingUser) {
      throw new BadRequestException('El nombre de usuario ya existe');
    }
    const adminUser = this.adminUserRepository.create(createAdminUserDto);
    return this.adminUserRepository.save(adminUser);
  }

  async update(
    id: number,
    updateAdminUserDto: UpdateAdminUserDto,
  ): Promise<AdminUserEntity> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Admin user with ID ${id} not found`);
    }
    if (
      updateAdminUserDto.username &&
      updateAdminUserDto.username !== user.username
    ) {
      const existingUser = await this.findByUsername(
        updateAdminUserDto.username,
      );
      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestException('Username already exists');
      }
    }
    Object.assign(user, updateAdminUserDto);
    return this.adminUserRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    // const user = await this.findById(id);
    // if (!user) {
    //   throw new NotFoundException(`Admin user with ID ${id} not found`);
    // }
    // user.isActive = false;
    // await this.adminUserRepository.save(user);
    await this.adminUserRepository.delete(id);
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

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: AdminUserEntity[]; total: number }> {
    const [data, total] = await this.adminUserRepository.findAndCount({
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
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
