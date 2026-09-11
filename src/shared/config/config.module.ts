import { validationOptions } from './validation/validation-options';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validationSchema } from './validation/validation-schema';
import { NestConfigService } from './config.service';

import { redisConfig } from './redis.config';
import { sendgridConfig } from './sendgrid.config';
import { jwtConfig } from './jwt.config';
import { mailConfig } from './mail.config';
import rabbitmqConfig from './rabbitmq.config';
import { redisClusterConfig } from '@/shared/config/redis-cluster.config';
import { socketConfig } from '@/shared/config/chat.gateway.config';
import { appConfig } from '@/shared/config/app.config';
import { databaseConfig } from '@/shared/config/database.config';
import { webpushConfig } from './webpush.config';
import { r2Config } from './r2.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        redisClusterConfig,
        sendgridConfig,
        jwtConfig,
        mailConfig,
        rabbitmqConfig,
        socketConfig,
        webpushConfig,
        r2Config,
      ],
      validationSchema,
      cache: true,
      validationOptions,
    }),
  ],

  providers: [NestConfigService],
  exports: [NestConfigService],
})
export class ConfigModule {}
