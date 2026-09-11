import { GenerateMessagingIdentityUseCase } from '@/modules/message/application/use-cases/generate-messaging-Identity/generateMessagingIdentity.usecase';

import { MessageIdentityPersistenceModule } from '@/modules/message/infrastructure/repositories/messageIdentity-persistence.module';
import { SnowflakeIdModule } from '@/shared/snowflake-generator/snowflakeId-generator.module';

import { Module } from '@nestjs/common';

@Module({
  imports: [SnowflakeIdModule, MessageIdentityPersistenceModule],
  providers: [GenerateMessagingIdentityUseCase],
  exports: [GenerateMessagingIdentityUseCase],
})
export class GenerateMessagingIdentityModule {}
