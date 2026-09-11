import { GetFollowersOrchestratorModule } from '@/modules/follow/application/orchestrators/get-followers-with-profile-orchestrator/get-user-followers-with-profiles.module';
import { GetFollowersWithScoresModule } from '@/modules/follow/application/orchestrators/get-followers-with-scores/get-followers-with-scores.module';
import { ShowManyFriendshipsModule } from '@/modules/follow/application/usecase/show-many-friendships/show-many-friendships.module';
import { FollowersTestController } from '@/modules/follow/presentation/controller/followers-test.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [GetFollowersWithScoresModule, ShowManyFriendshipsModule],
  controllers: [FollowersTestController],
})
export class FollowersControllerModule {}
