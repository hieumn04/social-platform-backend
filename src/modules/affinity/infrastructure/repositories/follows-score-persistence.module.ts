import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { DatabaseModule } from '@/shared/database/database.module';
import { FollowScoreEntity } from '@/modules/affinity/infrastructure/typeorm/follows-score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FollowScoreEntity]),
    DatabaseModule,
    LoggerModule,
  ],
  providers: [
    // {
    //   provide: 'FollowsScoreReadRepository',
    //   useClass: FollowsScoreReadRepositoryImpl,
    // },
  ],

  exports: [TypeOrmModule],
})
export class AffinityPersistenceModule {}
