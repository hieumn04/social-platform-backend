import { GetProfileInitialUseCase } from '@/modules/profile/application/usecases/get-profile-initial.usecase';
import { PROFILE_READ_REPOSITORY } from '@/modules/profile/domain/repositories/profile-read.repository';
import { ProfileReadRepositoryImpl } from '@/modules/profile/infrastructure/repositories/profile-read.repository.impl';
import { ProfileResolver } from '@/modules/profile/presentation/graphql/profile.resolver';
import { SocialGraphModule } from '@/modules/social-graph/social-graph.module';
import { AuthGuardsModule } from '@/modules/auth/guards/auth-guards.module';
import { DatabaseModule } from '@/shared/database/database.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, SocialGraphModule, AuthGuardsModule],
  providers: [
    {
      provide: PROFILE_READ_REPOSITORY,
      useClass: ProfileReadRepositoryImpl,
    },
    GetProfileInitialUseCase,
    ProfileResolver,
  ],
  exports: [GetProfileInitialUseCase],
})
export class ProfileModule {}
