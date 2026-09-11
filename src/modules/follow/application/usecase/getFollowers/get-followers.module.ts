import { GetFollowersUseCase } from '@/modules/follow/application/usecase/getFollowers/get-followers.usecase';
import { FollowPersistenceModule } from '@/modules/follow/infrastructure/repositories/follows-persistence.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [FollowPersistenceModule],
  providers: [GetFollowersUseCase],
  exports: [GetFollowersUseCase],
})
export class GetFollowersModule {}
