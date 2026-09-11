import { Module } from '@nestjs/common';
import { UserPersistenceModule } from 'src/modules/users/infrastructure/repositories/user-persistence.module';
import { GetUserProfilesByIdsUseCase } from '@/modules/users/application/use-cases/find-profiles/find-profiles-by-ids.usecase';

@Module({
  imports: [UserPersistenceModule],
  providers: [GetUserProfilesByIdsUseCase],
  exports: [GetUserProfilesByIdsUseCase],
})
export class FindProfileByIdsModule {}
