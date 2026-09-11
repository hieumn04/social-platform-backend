import { Module } from '@nestjs/common';
import { UserQueryService } from './user-query.adapter';

import { UserPersistenceModule } from 'src/modules/users/infrastructure/repositories/user-persistence.module';

@Module({
  imports: [UserPersistenceModule],
  providers: [
    {
      provide: 'IUserQueryAdapter',
      useClass: UserQueryService,
    },
  ],
  exports: ['IUserQueryAdapter'],
})
export class UserQueryModule {}
