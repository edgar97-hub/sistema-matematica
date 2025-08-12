import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminUsersService } from '../../admin-users/admin-users/admin-users.service';
import { AdminUserEntity } from '../../admin-users/entities/admin-user.entity';
import { UsersService } from '../../users/users/users.service';
import { UserEntity } from '../../users/entities/user.entity';
import { SystemConfigurationService } from '../../system-configuration/services/system-configuration.service';
import { CreditService } from '../../credit-system/services/credit.service';
import { CreditTransactionAction } from 'src/credit-system/entities/credit-transaction.entity';

export interface JwtPayload {
  sub: number;
  username?: string;
  email?: string;
  role: string;
  type: 'admin' | 'pwa';
}

@Injectable()
export class AuthService {
  constructor(
    private adminUsersService: AdminUsersService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private systemConfigurationService: SystemConfigurationService,
    private creditService: CreditService,
  ) {}

  async findProfileById(userId: number): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      pictureUrl: user.pictureUrl,
      countryOfOrigin: user.countryOfOrigin,
      credits: user.creditBalance,
      role: user.role,
    };
  }

  async loginAdmin(user: AdminUserEntity) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      type: 'admin',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateAdmin(
    username: string,
    password: string,
  ): Promise<AdminUserEntity | null> {
    return this.adminUsersService.validateUser(username, password);
  }

  async findOrCreatePwaUser(profile: any): Promise<UserEntity> {
    const user = await this.usersService.findOrCreateFromGoogle(profile);
    let creditIsAssigned = user.creditTransactions?.some(
      (item) => item.action === CreditTransactionAction.WELCOME_BONUS,
    );
    if (user.googleId && !creditIsAssigned) {
      const config = await this.systemConfigurationService.getConfiguration();
      if (config.welcomeCreditEnabled) {
        await this.creditService.addWelcomeCredits(
          user.id,
          config.welcomeCreditAmount,
        );
        const updatedUser = await this.usersService.findById(user.id);
        if (updatedUser) {
          return updatedUser;
        } else {
          throw new NotFoundException(
            `User with ID "${user.id}" not found after adding welcome credits`,
          );
        }
      }
    }

    return user;
  }

  async loginPwaUser(user: UserEntity) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'pwa',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile_picture: user.pictureUrl,
        creditBalance: user.creditBalance,
        role: user.role,
      },
    };
  }

  async validateJwtPayload(
    payload: JwtPayload,
  ): Promise<AdminUserEntity | UserEntity | null> {
    if (payload.type === 'admin') {
      return this.adminUsersService.findById(payload.sub);
    } else if (payload.type === 'pwa') {
      return this.usersService.findById(payload.sub);
    }
    return null;
  }
}
