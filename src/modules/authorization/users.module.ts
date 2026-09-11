import { Module } from '@nestjs/common';
import { RolePersistenceModule } from './infrastructure/repositories/user-persistence.module';

@Module({
  imports: [RolePersistenceModule],
})
export class AuthorizationModule {}
