import { LoginModule } from '@/modules/users/application/use-cases/login/login.module';

import { UserPersistenceModule } from '@/modules/users/infrastructure/repositories/user-persistence.module';
import { UserIdentityPersistenceModule } from '@/modules/users/infrastructure/repositories/userIdentity-persistence.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [UserPersistenceModule, UserIdentityPersistenceModule, LoginModule],
  // providers: [UserResolver],
  exports: [LoginModule],
})
export class UsersModule {}
