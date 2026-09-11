
import { ResolveThreadUseCase } from '@/modules/coversation/application/use-cases/routedefinition/resolve-thread.usecase';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
   ConversationPersistenceModule
  ],
  providers: [ResolveThreadUseCase],
  exports: [ResolveThreadUseCase],
})
export class ResolveThreadModule {}
