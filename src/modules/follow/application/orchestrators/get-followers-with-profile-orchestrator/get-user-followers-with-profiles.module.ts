import { GetFollowersOrchestrator } from '@/modules/follow/application/orchestrators/get-followers-with-profile-orchestrator/get-user-followers-with-profiles.usecase';
import { GetFollowersModule } from '@/modules/follow/application/usecase/getFollowers/get-followers.module';
import { FindProfileByIdsModule } from '@/modules/users/application/use-cases/find-profiles/find-profiles-by-ids.module';

import { Module } from '@nestjs/common';

@Module({
  imports: [GetFollowersModule, FindProfileByIdsModule],
  providers: [GetFollowersOrchestrator],
  exports: [GetFollowersOrchestrator],
})
export class GetFollowersOrchestratorModule {}
