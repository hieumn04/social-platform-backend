import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';

import { redisConfig } from './redis.config';
import { sendgridConfig } from './sendgrid.config';
import { jwtConfig } from './jwt.config';
import { mailConfig } from './mail.config';
import rabbitmqConfig from './rabbitmq.config';
import { socketConfig } from '@/shared/config/chat.gateway.config';
import { redisClusterConfig } from '@/shared/config/redis-cluster.config';
import { appConfig } from '@/shared/config/app.config';
import { databaseConfig } from '@/shared/config/database.config';
import { webpushConfig } from './webpush.config';
import { r2Config } from './r2.config';

@Injectable()
export class NestConfigService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    // If you want to use the configService directly, you have to function async onModuleInit() because
    // the system will not ensure that the configService is ready before this service is used.

    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
    @Inject(databaseConfig.KEY)
    private readonly databaseCfg: ConfigType<typeof databaseConfig>,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
    @Inject(redisConfig.KEY)
    private readonly redisCfg: ConfigType<typeof redisConfig>,
    @Inject(sendgridConfig.KEY)
    private readonly sendgridCfg: ConfigType<typeof sendgridConfig>,
    @Inject(mailConfig.KEY)
    private readonly mailCfg: ConfigType<typeof mailConfig>,
    @Inject(rabbitmqConfig.KEY)
    private readonly rabbitmqCfg: ConfigType<typeof rabbitmqConfig>,
    @Inject(socketConfig.KEY)
    private readonly socketCfg: ConfigType<typeof socketConfig>,
    @Inject(redisClusterConfig.KEY)
    private readonly redisClusterCfg: ConfigType<typeof redisClusterConfig>,
    @Inject(webpushConfig.KEY)
    private readonly webpushCfg: ConfigType<typeof webpushConfig>,
    @Inject(r2Config.KEY)
    private readonly r2Cfg: ConfigType<typeof r2Config>,
  ) {}

  onModuleInit() {
    this.validateConfig(this.appCfg, 'appConfig');
    this.validateConfig(this.databaseCfg, 'databaseConfig');
    this.validateConfig(this.jwtCfg, 'jwtConfig');
    this.validateConfig(this.redisCfg, 'redisConfig');
    this.validateConfig(this.sendgridCfg, 'sendgridConfig');
    this.validateConfig(this.mailCfg, 'mailConfig');
    this.validateConfig(this.rabbitmqCfg, 'rabbitmqConfig');
    this.validateConfig(this.socketCfg, 'socketConfig');
    this.validateConfig(this.redisClusterCfg, 'redisClusterConfig');
    this.validateConfig(this.webpushCfg, 'webpushConfig');
    this.validateConfig(this.r2Cfg, 'r2Config');
    console.log('[Config]  All configs loaded successfully');
  }

  private validateConfig<T>(
    config: T | null | undefined,
    name: string,
  ): asserts config is T {
    if (!config) {
      throw new Error(`[Config] Failed to inject ${name}`);
    }
  }

  get app() {
    return this.appCfg.app;
  }

  get database() {
    return this.databaseCfg.database;
  }

  get jwt() {
    return this.jwtCfg;
  }

  get redis() {
    return this.redisCfg;
  }

  get sendgrid() {
    return this.sendgridCfg;
  }

  get mail() {
    return this.mailCfg;
  }

  get rabbitmq() {
    return this.rabbitmqCfg;
  }

  get socket() {
    return this.socketCfg;
  }

  get redisCluster() {
    return this.redisClusterCfg;
  }

  get webpush() {
    return this.webpushCfg;
  }

  get r2() {
    return this.r2Cfg;
  }
}
