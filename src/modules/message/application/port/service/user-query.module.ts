import { Module } from '@nestjs/common';
import { UserQueryService } from './user-query.adapter';

import { UserPersistenceModule } from 'src/modules/users/infrastructure/repositories/user-persistence.module';

@Module({
  imports: [UserPersistenceModule],
  providers: [
    {
      provide: 'IUserQueryService',
      useClass: UserQueryService,
    },
  ],
  exports: ['IUserQueryService'],
})
export class UserQueryModule {}
