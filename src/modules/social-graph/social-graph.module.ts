import { SocialGraphPersistenceModule } from '@/modules/social-graph/infrastructure/repositories/follows-persistence.module';
import { Module } from '@nestjs/common';
import { FollowUserUseCase } from '@/modules/social-graph/application/usecases/follow-user.usecase';
import { UnfollowUserUseCase } from '@/modules/social-graph/application/usecases/unfollow-user.usecase';
import { AcceptFollowRequestUseCase } from '@/modules/social-graph/application/usecases/accept-follow-request.usecase';
import { BlockUserUseCase } from '@/modules/social-graph/application/usecases/block-user.usecase';
import { GetFriendshipStatusUseCase } from '@/modules/social-graph/application/usecases/get-friendship-status.usecase';
import { SocialGraphResolver } from '@/modules/social-graph/presentation/graphql/social-graph.resolver';
import { AuthGuardsModule } from '@/modules/auth/guards/auth-guards.module';

@Module({
  imports: [SocialGraphPersistenceModule, AuthGuardsModule],
  providers: [
    FollowUserUseCase,
    UnfollowUserUseCase,
    AcceptFollowRequestUseCase,
    BlockUserUseCase,
    GetFriendshipStatusUseCase,
    SocialGraphResolver,
  ],
  exports: [
    FollowUserUseCase,
    UnfollowUserUseCase,
    AcceptFollowRequestUseCase,
    BlockUserUseCase,
    GetFriendshipStatusUseCase,
  ],
})
export class SocialGraphModule {}
