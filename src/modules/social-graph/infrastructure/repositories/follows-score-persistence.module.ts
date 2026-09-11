// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { LoggerModule } from 'src/shared/logger/logger.module';
// import { DatabaseModule } from '@/shared/database/database.module';
// import { FollowScoreEntity } from '@/modules/follow/infrastructure/typeorm/follows-score.entity';
// import { FollowsScoreReadRepositoryImpl } from '@/modules/follow/infrastructure/repositories/follows-score-read-persistence.repository';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([FollowScoreEntity]),
//     DatabaseModule,
//     LoggerModule,
//   ],
//   providers: [
//     {
//       provide: 'FollowsScoreReadRepository',
//       useClass: FollowsScoreReadRepositoryImpl,
//     },
//   ],

//   exports: ['FollowsScoreReadRepository', TypeOrmModule],
// })
// export class FollowScorePersistenceModule {}
