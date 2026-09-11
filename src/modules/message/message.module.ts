import { Module } from '@nestjs/common';

import { MessageIdentityPersistenceModule } from '@/modules/message/infrastructure/repositories/messageIdentity-persistence.module';
import { SendMessageModule } from '@/modules/message/application/use-cases/send-first-message/send-message.module';
import { MessageResolver } from '@/modules/message/prensentation/graphql/resolvers/message.resolver';
import { LockModule } from '@/shared/redis-cluster/red-lock/lock.module';
import { MessagePersistenceModule } from '@/modules/message/infrastructure/repositories/message-persistence.module';
import { MessageWorkerModule } from '@/modules/message/infrastructure/workers/message-worker.module';

@Module({
  imports: [
    MessagePersistenceModule,
    MessageIdentityPersistenceModule,
    SendMessageModule,
    LockModule,
    MessageWorkerModule,
  ],
  providers: [MessageResolver],
})
export class MessageModule {}
