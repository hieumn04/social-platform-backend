import { Module } from '@nestjs/common';
import { PresenceResolver } from '@/modules/chat/presentation/graphql/resolvers/presence.resolver';
import { PresenceModule } from '@/shared/redis-cluster/presence/presence.module';

/**
 * Wires the GraphQL PresenceResolver with the shared PresenceService.
 * Import this module in AppModule.
 */
@Module({
  imports: [PresenceModule],
  providers: [PresenceResolver],
})
export class ChatPresenceModule {}
