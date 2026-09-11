import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { DatabaseModule } from '@/shared/database/database.module';

import { UserFollowEventEntity } from '@/modules/social-activity/infrastructure/typeorm/user-follow-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFollowEventEntity]),
    DatabaseModule,
    LoggerModule,
  ],
  providers: [],

  exports: [TypeOrmModule],
})
export class SocialActivityPersistenceModule {}
