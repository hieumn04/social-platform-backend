import { DataSourceOptions } from 'typeorm';
import { DatabaseConfig } from 'src/types/environment';

export const allowedDbTypes = [
  'mysql',
  'mariadb',
  'postgres',
  'sqlite',
  'mssql',
  'oracle',
] as const;

type AllowedDbType = (typeof allowedDbTypes)[number];
export const parseDatabaseEnv = (): DatabaseConfig => {
  const rawType = process.env.DB_TYPE;
  const isValidType = allowedDbTypes.includes(rawType as AllowedDbType);
  return {
    type: (isValidType
      ? (rawType as AllowedDbType)
      : 'mysql') as DataSourceOptions['type'],
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthy',
    synchronize: process.env.TYPEORM_SYNC === 'true',
    logging: process.env.TYPEORM_LOG === 'true',
    retryAttempts: parseInt(process.env.TYPEORM_RETRY_ATTEMPTS || '2', 10),
    retryDelay: parseInt(process.env.TYPEORM_RETRY_DELAY || '5000', 10),
    autoLoadEntities: true,
  };
};
