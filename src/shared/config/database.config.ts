import { parseDatabaseEnv } from '@/shared/database/env.database';
import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  database: parseDatabaseEnv(),
}));
