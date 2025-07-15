// Se han realizado varias correcciones y mejoras en este archivo.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminUsersModule } from './admin-users/admin-users.module'; // Asumo que este módulo existe
import { EducationalContentModule } from './educational-content/educational-content.module'; // Asumo que este módulo existe

// --- INICIO: Lógica del sistema de créditos (Candidato para un módulo propio) ---
import { CreditPackageEntity } from './credit-system/entities/credit-package.entity';
import { CreditTransactionEntity } from './credit-system/entities/credit-transaction.entity';
import { CreditService } from './credit-system/services/credit.service';
import { CreditPackageService } from './credit-system/services/credit-package.service';
import { StripeService } from './credit-system/services/stripe.service';
import { CreditController } from './credit-system/controllers/credit.controller';
import { CreditPackageController } from './credit-system/controllers/credit-package.controller';
// --- FIN: Lógica del sistema de créditos ---

import { CustomLoggerService } from './common/services/logger.service';
import { SystemConfigurationModule } from './system-configuration/system-configuration.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { MathProcessingModule } from './math-processing/math-processing.module';
import { OrdersModule } from './orders/orders.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ExercisesModule } from './exercises/exercises.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT')
          ? parseInt(configService.get('DB_PORT') as string, 10)
          : 3306,
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        namingStrategy: new SnakeNamingStrategy(),
      }),
      inject: [ConfigService],
    }),
    // NOTA: Es una mejor práctica que cada módulo (como CreditSystemModule y OrdersModule)
    // importe sus propias entidades con TypeOrmModule.forFeature.
    TypeOrmModule.forFeature([
      CreditPackageEntity,
      CreditTransactionEntity,
    ]),
    OrdersModule,
    UsersModule,
    AuthModule,
    AdminUsersModule,
    EducationalContentModule,
    SystemConfigurationModule,
    FileStorageModule,
    MathProcessingModule,
    ExercisesModule, // Asegúrate de que esta línea esté presente
  ],
  controllers: [
    AppController,
    CreditController,
    CreditPackageController,
  ],
  providers: [
    AppService,
    // Los siguientes servicios deberían agruparse en un CreditSystemModule
    // para una mejor organización y encapsulamiento.
    CreditService,
    CreditPackageService,
    StripeService,
    CustomLoggerService,
  ],
})
export class AppModule {}
