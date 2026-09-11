import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerModule } from 'src/shared/logger/logger.module';

import { DatabaseModule } from '@/shared/database/database.module';
import { FollowEdgeEntity } from '@/modules/social-graph/infrastructure/typeorm/follows.entity';
import { InteractionEdgeEntity } from '@/modules/social-graph/infrastructure/typeorm/interaction-edge.entity';
import { MuteEdgeEntity } from '@/modules/social-graph/infrastructure/typeorm/mute-edge.entity';
import { BlockEdgeEntity } from '@/modules/social-graph/infrastructure/typeorm/block-edge.entity';
import { CloseFriendEdgeEntity } from '@/modules/social-graph/infrastructure/typeorm/close-friend-edge.entity';
import { FollowRequestEdgeEntity } from '@/modules/social-graph/infrastructure/typeorm/follow-request-edge.entity';
import { NotificationPrefEntity } from '@/modules/social-graph/infrastructure/typeorm/notification-pref.entity';
import { ProfileVisitEdgeEntity } from '@/modules/social-graph/infrastructure/typeorm/profile-visit-edge.entity';
import { RestrictEdgeEntity } from '@/modules/social-graph/infrastructure/typeorm/restrict-edge.entity';
import { BlockEdgeRepositoryImpl } from '@/modules/social-graph/infrastructure/repositories/block-edge.repository.impl';
import { RestrictEdgeRepositoryImpl } from '@/modules/social-graph/infrastructure/repositories/restrict-edge.repository.impl';
import { SocialGraphRepositoryImpl } from '@/modules/social-graph/infrastructure/repositories/social-graph.repository.impl';
import { SOCIAL_GRAPH_REPOSITORY } from '@/modules/social-graph/domain/repositories/social-graph.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FollowEdgeEntity,
      InteractionEdgeEntity,
      MuteEdgeEntity,
      BlockEdgeEntity,
      CloseFriendEdgeEntity,
      FollowRequestEdgeEntity,
      NotificationPrefEntity,
      ProfileVisitEdgeEntity,
      RestrictEdgeEntity,
    ]),
    DatabaseModule,
    LoggerModule,
  ],
  providers: [
    {
      provide: 'IBlockEdgeRepository',
      useClass: BlockEdgeRepositoryImpl,
    },
    {
      provide: 'IRestrictEdgeRepository',
      useClass: RestrictEdgeRepositoryImpl,
    },
    {
      provide: SOCIAL_GRAPH_REPOSITORY,
      useClass: SocialGraphRepositoryImpl,
    },
  ],

  exports: [
    'IBlockEdgeRepository',
    'IRestrictEdgeRepository',
    SOCIAL_GRAPH_REPOSITORY,
  ],
})
export class SocialGraphPersistenceModule {}
