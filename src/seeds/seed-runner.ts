import { typeOrmConfig } from 'src/shared/database/typeorm.config';
import { DataSource } from 'typeorm';
import { seedRole } from './seeders/seed-users';

async function runSeeder() {
  const dataSource = new DataSource(typeOrmConfig);
  await dataSource.initialize();
  console.log('Database connected successfully');

  await seedRole(dataSource);
  console.log('Seeding completed successfully');

  await dataSource.destroy();
  console.log('Database connection closed');
}

runSeeder().catch((error) => {
  console.error('Error during seeding:', error);
  process.exit(1);
});
