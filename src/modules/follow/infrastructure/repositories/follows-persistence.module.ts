// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';

// import { LoggerModule } from 'src/shared/logger/logger.module';

// import { DatabaseModule } from '@/shared/database/database.module';
// import { FollowEdgeEntity } from '@/modules/follow/infrastructure/typeorm/follows.entity';
// import { InteractionEdgeEntity } from '@/modules/follow/infrastructure/typeorm/interaction-edge.entity';
// import { MuteEdgeEntity } from '@/modules/follow/infrastructure/typeorm/mute-edge.entity';
// import { BlockEdgeEntity } from '@/modules/follow/infrastructure/typeorm/block-edge.entity';
// import { CloseFriendEdgeEntity } from '@/modules/follow/infrastructure/typeorm/close-friend-edge.entity';
// import { FollowRequestEdgeEntity } from '@/modules/follow/infrastructure/typeorm/follow-request-edge.entity';
// import { NotificationPrefEntity } from '@/modules/follow/infrastructure/typeorm/notification-pref.entity';
// import { ProfileVisitEdgeEntity } from '@/modules/follow/infrastructure/typeorm/profile-visit-edge.entity';
// import { RestrictEdgeEntity } from '@/modules/follow/infrastructure/typeorm/restrict-edge.entity';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([
//       FollowEdgeEntity,
//       InteractionEdgeEntity,
//       MuteEdgeEntity,
//       BlockEdgeEntity,
//       CloseFriendEdgeEntity,
//       FollowRequestEdgeEntity,
//       NotificationPrefEntity,
//       ProfileVisitEdgeEntity,
//       RestrictEdgeEntity,
//     ]),
//     DatabaseModule,
//     LoggerModule,
//   ],
//   // providers: [
//   //   {
//   //     provide: 'FollowsReadRepository',
//   //     useClass: FollowsReadRepositoryImpl,
//   //   },
//   // ],

//   exports: [TypeOrmModule],
// })
// export class FollowPersistenceModule {}
