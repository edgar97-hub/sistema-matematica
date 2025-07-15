import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminUsersService } from '../admin-users/admin-users/admin-users.service';
import { AdminRole } from '../admin-users/enums/admin-role.enum';

async function createAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminUsersService = app.get(AdminUsersService);

  try {
    // Check if admin already exists
    const existingAdmin = await adminUsersService.findByUsername('admin');
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = await adminUsersService.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@sistema-matematica.com',
      name: 'Administrator',
      role: AdminRole.ADMINISTRATOR,
    });

    console.log('Admin user created successfully:', {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await app.close();
  }
}

createAdminUser();
