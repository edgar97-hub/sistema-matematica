import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginDto } from '../dto/login.dto';
import { UserEntity } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const userId = req.user.id;
    return this.authService.findProfileById(userId);
  }

  @UseGuards(LocalAuthGuard)
  @Post('admin/login')
  async loginAdmin(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.loginAdmin(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/profile')
  getAdminProfile(@Request() req) {
    return {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    };
  }

  // Google OAuth Endpoints for PWA Users
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {
    // This method initiates the Google OAuth flow
    // Passport will handle the redirect to Google
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google')) // GoogleStrategy se encarga de findOrCreatePwaUser
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    if (!req.user) {
      const frontendLoginUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      return res.redirect(
        `${frontendLoginUrl}/login?error=${encodeURIComponent('Fallo en la autenticación con Google')}`,
      );
    }

    // req.user aquí es UserEntity (o el objeto que devuelve tu GoogleStrategy.validate -> authService.findOrCreatePwaUser)
    const pwaUser = req.user as UserEntity; // Asegúrate del tipo
    const loginResult = await this.authService.loginPwaUser(pwaUser); // Genera el JWT

    const frontendCallbackUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001'}/auth/google/callback`;

    if (loginResult.access_token) {
      res.redirect(`${frontendCallbackUrl}?token=${loginResult.access_token}`);
    } else {
      const frontendLoginUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(
        `${frontendLoginUrl}/login?error=${encodeURIComponent('Error al generar sesión')}`,
      );
    }
  }

  // PWA User Profile Endpoint
  @UseGuards(JwtAuthGuard)
  @Get('pwa/profile')
  getPwaProfile(@Request() req) {
    if ('username' in req.user) {
      // Admin user
      return {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        type: 'admin',
      };
    } else {
      // PWA user
      return {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        pictureUrl: req.user.pictureUrl,
        credits: req.user.creditBalance,
        role: req.user.role,
        type: 'pwa',
        countryOfOrigin: req.user.countryOfOrigin,
      };
    }
  }
}
