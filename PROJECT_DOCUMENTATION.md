# Documentación del Proyecto: Sistema Matemática

Este documento proporciona una visión general completa del proyecto "Sistema Matemática", cubriendo tanto sus componentes de backend como de frontend.

## 1. Resumen del Proyecto

"Sistema Matemática" es una aplicación diseñada para facilitar el aprendizaje y la resolución de problemas matemáticos. Cuenta con un backend robusto para manejar la lógica de negocio, el almacenamiento de datos y las integraciones, y un frontend dinámico para la interacción del usuario, incluyendo un panel de administración y una Aplicación Web Progresiva (PWA) para los usuarios finales.

## 2. Documentación del Backend

### 2.1. Visión General de la Arquitectura

El backend está construido utilizando [NestJS](https://nestjs.com/), un framework progresivo de Node.js para construir aplicaciones de servidor eficientes, confiables y escalables. Aprovecha TypeScript y sigue una estructura modular, promoviendo la organización y reutilización del código. La aplicación utiliza una arquitectura similar a microservicios con módulos distintos para diferentes funcionalidades.

### 2.2. Módulos Principales

El `AppModule` (backend/src/app.module.ts) sirve como el módulo raíz, importando y orquestando varios módulos de características. Los módulos clave incluyen:

- **AuthModule**: Maneja la autenticación de usuarios, incluyendo estrategias locales y de Google OAuth, gestión de tokens JWT y control de acceso basado en roles de administrador/usuario.
- **UsersModule**: Gestiona las operaciones relacionadas con el usuario, incluyendo la creación, recuperación y actualización de usuarios. Se integra con `EducationalContentModule` e implementa el throttling para la limitación de velocidad.
- **AdminUsersModule**: Gestiona las cuentas de usuario administrativas y sus funcionalidades específicas.
- **CreditSystemModule**: Gestiona los paquetes de créditos, las transacciones de créditos y los servicios relacionados con los créditos. Se integra con `UsersModule` y `SystemConfigurationModule`.
- **EducationalContentModule**: Gestiona el contenido educativo como países, etapas educativas y subdivisiones.
- **ExercisesModule**: Maneja la creación, recuperación y gestión de ejercicios.
- **FileStorageModule**: Proporciona servicios para el almacenamiento de archivos, probablemente para imágenes y videos de ejercicios.
- **MathProcessingModule**: Se integra con servicios externos como SimpleTex y OpenAI para el procesamiento relacionado con las matemáticas y Manim para animaciones.
- **OrdersModule**: Gestiona las órdenes de resolución, incluyendo la creación, filtrado y clasificación.
- **SystemConfigurationModule**: Gestiona las configuraciones de todo el sistema.

### 2.3. Punto de Entrada Principal (`main.ts`)

El archivo `main.ts` (backend/src/main.ts) es el punto de entrada de la aplicación. Configura la aplicación NestJS, configura pipes globales para la validación, habilita CORS, sirve activos estáticos (uploads) y establece un prefijo global de API (`/api`). También incluye código comentado para la configuración HTTPS, lo que indica un posible uso futuro o una configuración específica de desarrollo.

### 2.4. Integración de Base de Datos

La aplicación utiliza [TypeORM](https://typeorm.io/) con MySQL como base de datos. La configuración `TypeOrmModule.forRootAsync` en `AppModule` recupera dinámicamente las credenciales de la base de datos de las variables de entorno. Utiliza `SnakeNamingStrategy` para una nomenclatura consistente de las columnas de la base de datos, convirtiendo las propiedades de la entidad camelCase a columnas de base de datos snake_case.

### 2.5. Autenticación y Autorización

- **Estrategias**: Las estrategias locales (nombre de usuario/contraseña) y de Google OAuth se implementan utilizando [Passport.js](https://www.passportjs.org/).
- **JWT**: Los JSON Web Tokens se utilizan para la gestión de sesiones y la autenticación. Los tokens se configuran con un tiempo de caducidad.
- **Guards**: `JwtAuthGuard` y `AdminGuard` se utilizan para proteger rutas basadas en roles de usuario y estado de autenticación, asegurando que solo los usuarios autorizados puedan acceder a recursos específicos.

### 2.6. Funcionalidades Clave del Backend

- **Gestión de Usuarios**: Creación, autenticación y gestión tanto de usuarios regulares (PWA) como de usuarios administradores.
- **Sistema de Créditos**: Gestión de paquetes de créditos, procesamiento de transacciones de créditos (por ejemplo, webhooks de Stripe) y actualizaciones de saldo de créditos para los usuarios.
- **Gestión de Contenido Educativo**: Operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para países, etapas educativas y subdivisiones, formando la base para categorizar el contenido matemático.
- **Gestión de Ejercicios**: Creación y gestión de ejercicios matemáticos, incluyendo la carga de archivos para imágenes y videos, que se almacenan y sirven de forma estática.
- **Procesamiento Matemático**: Integración con herramientas externas para renderizar expresiones matemáticas (SimpleTex) y potencialmente generar contenido (OpenAI), junto con Manim para animaciones.
- **Gestión de Órdenes**: Manejo de solicitudes de usuarios para resoluciones de ejercicios, rastreando su estado a través de un pipeline.
- **Almacenamiento de Archivos**: Módulo dedicado para manejar la carga de archivos y servir contenido estático, crucial para ejercicios multimedia.
- **Configuración del Sistema**: Gestión centralizada de la configuración de la aplicación, permitiendo ajustes dinámicos sin cambios en el código.

### 2.7. Registro (Logging)

El `CustomLoggerService` (backend/src/common/services/logger.service.ts) proporciona capacidades de registro personalizadas para la aplicación, lo que ayuda en la depuración y el monitoreo.

### 2.8. Variables de Entorno

La aplicación depende en gran medida de las variables de entorno para la configuración, incluyendo las credenciales de la base de datos, los secretos JWT y las URL de la API. Estas se cargan a través del `ConfigModule` de `@nestjs/config`, asegurando que la información sensible no esté codificada.

### 2.9. Dependencias del Backend

Las dependencias clave del backend incluyen:
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`: Módulos centrales de NestJS para construir la aplicación.
- `@nestjs/typeorm`, `typeorm`, `mysql2`: Para la integración de la base de datos y las capacidades ORM.
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`, `passport-google-oauth20`: Para una autenticación y autorización completas.
- `@nestjs/config`: Para gestionar configuraciones específicas del entorno.
- `@nestjs/throttler`: Para implementar la limitación de velocidad para prevenir el abuso.
- `morgan`: Un middleware de registro de solicitudes HTTP para Node.js.
- `body-parser`: Middleware para analizar los cuerpos de las solicitudes entrantes.
- `class-validator`, `class-transformer`: Para la validación y transformación de DTOs (Objetos de Transferencia de Datos).

## 3. Documentación del Frontend

### 3.1. Visión General de la Arquitectura

El frontend está construido utilizando [Next.js](https://nextjs.org/) (un framework de React) y [Mantine](https://mantine.dev/) para los componentes de la interfaz de usuario. Sigue una arquitectura basada en componentes y aprovecha el enrutamiento del sistema de archivos de Next.js para diferentes secciones de la aplicación (panel de administración, público/onboarding, aplicación PWA). La gestión del estado se realiza utilizando [Zustand](https://zustand-demo.pmnd.rs/).

### 3.2. Secciones Clave y Enrutamiento

La aplicación está estructurada en grupos de enrutamiento distintos utilizando las convenciones de carpetas de Next.js:

- **`(admin_panel)`**: Contiene páginas y componentes específicos del panel de administración.
  - Ejemplos: `/admin/admin-users`, `/admin/credit-packages`, `/admin/educational-content`, `/admin/resolution-orders`, `/admin/settings`, `/admin/users-pwa`.
  - El acceso a estas rutas está restringido a usuarios autenticados con el rol `ADMINISTRATOR`.
- **`(public_or_onboarding)`**: Incluye páginas de cara al público y flujos iniciales de onboarding.
  - Ejemplos: `/login`, `/admin/login`, `/auth/google/callback`, `/payment/success`, `/payment/cancelled`.
  - Estas páginas manejan la autenticación del usuario y el acceso inicial.
- **`(pwa_app)`**: Alberga las principales funcionalidades de la Aplicación Web Progresiva para usuarios regulares.
  - Ejemplos: `/credits`, `/dashboard`, `/orders`, `/orders/new`.
  - El acceso está restringido a usuarios autenticados con el rol `CLIENT`.

### 3.3. Gestión del Estado

- **Zustand (`auth.store.ts`)**: La solución principal de gestión de estado. El hook `useAuthStore` gestiona:
  - Estado de autenticación del usuario (`isAuthenticated`, `isLoading`, `user`, `token`).
  - Datos del usuario (interfaz `UserPwa`, incluyendo créditos, rol, etc.).
  - Preferencia de tema (`light`, `dark`, `auto`).
  - Acciones para `setUser`, `logout`, `setLoading`, `setError`, `setTheme`, `toggleTheme`.
  - **Sondeo de Créditos**: Implementa un mecanismo para obtener periódicamente los saldos de créditos actualizados del usuario desde el backend y mostrar notificaciones si los créditos cambian. Esto asegura que el saldo de créditos del usuario esté siempre actualizado.
- **React Query (`@tanstack/react-query`)**: Se utiliza para la gestión del estado del servidor, la obtención de datos, el almacenamiento en caché y la sincronización. Cada diseño principal (`admin_panel`, `public_or_onboarding`, `pwa_app`) tiene su propia instancia de `QueryClientProvider`.

### 3.4. Flujo de Autenticación

- **`AuthHydrator.tsx`**: Un componente del lado del cliente responsable de rehidratar el estado de autenticación desde el almacenamiento local al cargar la aplicación. Intenta validar el token JWT almacenado con el backend (endpoint `/auth/me`) y actualiza el store de Zustand en consecuencia. Si el token no es válido, el usuario cierra la sesión.
- **Páginas de Inicio de Sesión**: Páginas de inicio de sesión separadas para usuarios administradores y PWA (`/admin/login`, `/login`) manejan las credenciales del usuario y las devoluciones de llamada de Google OAuth.
- **Protección de Rutas**: Los componentes de diseño (`(admin_panel)/layout.tsx`, `(pwa_app)/layout.tsx`) implementan la protección de rutas del lado del cliente, redirigiendo a los usuarios no autenticados o no autorizados a las páginas de inicio de sesión apropiadas.

### 3.5. Componentes de UI

- **Mantine**: Proporciona un conjunto completo de componentes React preconstruidos, asegurando una interfaz de usuario consistente y receptiva.
- **Componentes Personalizados**: Organizados dentro de `src/components/` por funcionalidad (por ejemplo, `admin`, `auth`, `layout`, `pwa`). Estos incluyen:
  - **Componentes de Diseño**: `MainLayout` (para navegación y barra lateral consistentes), `AdminSidebarItems`, `PwaSidebarItems`.
  - **Componentes de Formulario**: Formularios reutilizables para crear/editar entidades como `CreditPackageFormComponent`, `CountryFormComponent`, `UserPwaFormComponent`.
  - **Componentes de Tabla**: Para mostrar listas de datos, como `CreditPackageTable`, `CountryTable`, `CreditTransactionTable`, `PwaUserTable`.
  - **Componentes de Utilidad**: `ThemeToggle` para cambiar entre modos claro/oscuro.

### 3.6. Comunicación con la API

- **`apiClient.ts`**: Una instancia de Axios configurada para realizar solicitudes API al backend. Probablemente maneja la configuración de la URL base y, potencialmente, interceptores de solicitud/respuesta para el manejo de errores o la inyección de tokens.
- **Capa de Servicio (`src/lib/services/`)**: Contiene archivos de servicio dedicados (por ejemplo, `admin-user.service.ts`, `credit-package.service.ts`, `order.service.ts`) que encapsulan las llamadas a la API relacionadas con recursos específicos, promoviendo la organización y reutilización del código.

### 3.7. Estilizado

- **Módulos SCSS**: Se utilizan para el estilo específico de los componentes (por ejemplo, `CreditPackageTable.module.css`, `login-page.module.css`).
- **Estilos Globales**: `globals.scss` y `theme-variables.scss` definen estilos globales y variables de tema.
- **Estilos de Mantine**: `@mantine/core/styles.css` y `@mantine/notifications/styles.css` importan los estilos predeterminados de Mantine.

### 3.8. Dependencias del Frontend

Las dependencias clave del frontend incluyen:
- `next`: El framework de React para construir la aplicación.
- `react`, `react-dom`: Librerías principales de React.
- `@mantine/core`, `@mantine/notifications`, `@mantine/dropzone`: Librería de UI de Mantine y sus extensiones.
- `@tanstack/react-query`: Para una sólida obtención y almacenamiento en caché de datos.
- `zustand`, `zustand/middleware`: Para la gestión y persistencia del estado.
- `axios`: Para realizar solicitudes HTTP a la API del backend.
- `sass`: Para el estilizado SCSS.