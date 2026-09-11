import { Module } from '@nestjs/common';

import { UserQueryModule } from 'src/modules/users/application/port/service/user-query.module';
import { IUserQueryAdapter } from './IUserQuery.adapter';

@Module({
  imports: [UserQueryModule],
  providers: [IUserQueryAdapter],
  exports: [IUserQueryAdapter],
})
export class IUserQueryModule {}
