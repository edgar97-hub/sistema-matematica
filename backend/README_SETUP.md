# Sistema de Resolución Matemática por IA - Backend

## Configuración Inicial

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Configuración de Base de Datos
1. Instalar MySQL 8.0 o superior
2. Crear la base de datos:
```sql
CREATE DATABASE sistema_matematica_ia;
```

### 3. Variables de Entorno
Copiar `.env.example` a `.env` y configurar las variables:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_DATABASE=sistema_matematica_ia

# JWT Configuration
JWT_SECRET=tu-jwt-secret-super-seguro
JWT_EXPIRATION_TIME=24h
```

### 4. Ejecutar Migraciones
El proyecto está configurado con `synchronize: true` en desarrollo, por lo que las tablas se crearán automáticamente.

### 5. Crear Usuario Administrador
```bash
npm run build
npx ts-node src/scripts/create-admin.ts
```

Credenciales por defecto:
- Username: `admin`
- Password: `admin123`

### 6. Ejecutar el Servidor
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Endpoints Disponibles

### Autenticación Admin
- `POST /auth/admin/login` - Login de administrador
- `GET /auth/admin/profile` - Perfil del administrador (requiere JWT)

### Ejemplo de Login
```bash
curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Ejemplo de Acceso a Perfil
```bash
curl -X GET http://localhost:3000/auth/admin/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Estructura del Proyecto

```
src/
├── common/
│   └── entities/
│       └── base.entity.ts          # Entidad base con id, createdAt, updatedAt
├── admin-users/
│   ├── entities/
│   │   └── admin-user.entity.ts    # Entidad de usuarios administradores
│   ├── enums/
│   │   └── admin-role.enum.ts      # Roles de administrador
│   └── admin-users/
│       ├── admin-users.service.ts  # Servicio de usuarios admin
│       └── admin-users.module.ts   # Módulo de usuarios admin
├── auth/
│   ├── strategies/
│   │   ├── local.strategy.ts       # Estrategia de autenticación local
│   │   └── jwt.strategy.ts         # Estrategia de validación JWT
│   ├── guards/
│   │   ├── local-auth.guard.ts     # Guard para autenticación local
│   │   └── jwt-auth.guard.ts       # Guard para validación JWT
│   ├── dto/
│   │   └── login.dto.ts            # DTO para login
│   └── auth/
│       ├── auth.service.ts         # Servicio de autenticación
│       ├── auth.controller.ts      # Controlador de autenticación
│       └── auth.module.ts          # Módulo de autenticación
├── scripts/
│   └── create-admin.ts             # Script para crear usuario admin
└── app.module.ts                   # Módulo principal
```

## Próximos Pasos

### Fase 2: Usuarios PWA y Google OAuth
- Implementar GoogleStrategy
- Crear UserEntity para usuarios PWA
- Configurar endpoints de autenticación PWA

### Fase 3: Sistema de Créditos
- Implementar CreditPackageEntity
- Crear CreditTransactionEntity
- Integrar con Stripe

### Fase 4: Procesamiento Matemático
- Integrar Mathpix OCR
- Configurar OpenAI GPT-4o
- Implementar pipeline de procesamiento

## Comandos Útiles

```bash
# Generar nuevo módulo
npx nest generate module nombre-modulo

# Generar servicio
npx nest generate service nombre-modulo/nombre-servicio --no-spec

# Generar controlador
npx nest generate controller nombre-modulo/nombre-controlador --no-spec

# Compilar proyecto
npm run build

# Ejecutar tests
npm run test

# Ejecutar en modo desarrollo con watch
npm run start:dev
```

## Estado Actual

✅ **Completado - Fase 1:**
- Configuración base del proyecto NestJS
- Configuración de TypeORM con MySQL
- BaseEntity común
- Variables de entorno

✅ **Completado - Fase 2:**
- AdminUserEntity con hasheo de contraseñas
- AdminUsersModule y AdminUsersService
- AuthModule con LocalStrategy y JwtStrategy
- Endpoints de login y perfil para administradores
- Guards de autenticación

🔄 **Próximo:** Implementar usuarios PWA y Google OAuth