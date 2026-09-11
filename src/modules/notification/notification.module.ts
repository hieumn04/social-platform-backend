import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscriptionEntity } from './infrastructure/typeorm/entities/push-subscription.entity';
import { PushSubscriptionRepository } from './infrastructure/repositories/push-subscription.repository';
import { PushNotificationService } from './application/services/push-notification.service';
import { PushSubscriptionController } from './presentation/controllers/push-subscription.controller';
import { ConfigModule } from '@/shared/config/config.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { SnowflakeIdModule } from '@/shared/snowflake-generator/snowflakeId-generator.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushSubscriptionEntity]),
    ConfigModule,
    LoggerModule,
    SnowflakeIdModule,
    AuthModule,
  ],
  providers: [
    PushSubscriptionRepository,
    PushNotificationService,
  ],
  controllers: [
    PushSubscriptionController,
  ],
  exports: [
    PushNotificationService,
    PushSubscriptionRepository,
  ],
})
export class PushNotificationModule {}
