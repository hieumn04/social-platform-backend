import { DirectViewerThreadModule } from '@/modules/coversation/application/use-cases/direct-viewer-thread/direct-viewer-thread.module';
import { MarkSeenModule } from '@/modules/coversation/application/use-cases/mark-seen/mark-seen.module';
import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';
import { ConversationsControllerModule } from '@/modules/coversation/presentation/controllers/conversation.controller.module';
import { ThreadResolver } from '@/modules/coversation/presentation/graphql/resolvers/thread.resolver';

import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '@/modules/auth/guards/auth-guards.module';

@Module({
  imports: [
    ConversationPersistenceModule,
    ConversationsControllerModule,
    DirectViewerThreadModule,
    MarkSeenModule,
    AuthGuardsModule,
  ],
  providers: [ThreadResolver],
})
export class ConversationModule {}
