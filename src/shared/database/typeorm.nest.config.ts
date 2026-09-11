import { ExtendedTypeOrmConfig } from 'src/types/environment';
import { NestConfigService } from '../config/config.service';

export const typeOrmNextConfig = (
  configService: NestConfigService,
): ExtendedTypeOrmConfig =>
  ({
    type: configService.database.type,
    host: configService.database.host,
    port: configService.database.port,
    username: configService.database.username,
    password: configService.database.password,
    database: configService.database.database,
    synchronize: configService.database.synchronize,
    logging: configService.database.logging,
    retryAttempts: configService.database.retryAttempts,
    retryDelay: configService.database.retryDelay,
    autoLoadEntities: configService.database.autoLoadEntities,
  }) as ExtendedTypeOrmConfig;
