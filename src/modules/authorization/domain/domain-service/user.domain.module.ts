import { Module } from '@nestjs/common';

import { UserPersistenceModule } from '../../infrastructure/repositories/user-persistence.module';
import { UserDomainService } from './user.domain-service';

@Module({
  imports: [UserPersistenceModule],
  providers: [UserDomainService],
  exports: [UserDomainService],
})
export class UserDomainModule {}
