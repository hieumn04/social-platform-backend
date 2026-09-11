import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { NodeEnv } from 'src/shared/config/env';
import { DataSourceOptions } from 'typeorm';

export interface AppConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  workerId: number;
}

export interface DatabaseConfig {
  type: DataSourceOptions['type'];
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  retryAttempts: number;
  retryDelay: number;
  autoLoadEntities: boolean;
}

export type ExtendedTypeOrmConfig = TypeOrmModuleOptions;

export interface AppConfig {
  port: number;
  env: NodeEnv;
}
