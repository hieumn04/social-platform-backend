import * as dotenv from 'dotenv';
import * as path from 'path';
import { parseDatabaseEnv } from '../database/env.database';
import { DataSourceOptions } from 'typeorm';

dotenv.config({
  path: path.resolve(__dirname, '../../../.env.development'),
});

const isCompiled = __dirname.includes('dist');
const dbConfig = parseDatabaseEnv();

const entitiesPath = isCompiled
  ? 'dist/modules/**/infrastructure/typeorm/*.entity.js'
  : 'src/modules/**/infrastructure/typeorm/*.entity.ts';

export const typeOrmConfig: DataSourceOptions = (() => {
  switch (dbConfig.type) {
    case 'mysql':
    case 'mariadb':
    case 'postgres':
      return {
        type: dbConfig.type,
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
        entities: [
          // path.join(rootDir, '**/infrastructure/typeorm/*.entity' + fileExt),
          entitiesPath,
        ],

        logging: dbConfig.logging,
        synchronize: false,
        ...(dbConfig.type === 'mysql' || dbConfig.type === 'mariadb'
          ? {
              supportBigNumbers: true,
              bigNumberStrings: true,
            }
          : {}),
      } satisfies DataSourceOptions;

    default:
      throw new Error(`Unsupported DB_TYPE: ${dbConfig.type}`);
  }
})();
