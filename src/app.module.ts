import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from './shared/redis/redis.module';
import { MiddlewareModule } from './shared/infrastructure/middleware/middleware.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './modules/auth/auth.module';
import { OrchestratorsModule } from './application/orchestrators/application.module';
import { AuthorizationModule } from './modules/authorization/users.module';

import { PostsModule } from './modules/posts/posts.module';

import { MessageModule } from './modules/message/message.module';
import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';
import { SocketGatewayModule } from '@/modules/chat/gateway/socket-gateway.module';
import { NodeHeartBeatModule } from '@/shared/redis-cluster/nodeheartbeat/node-heart-beat-module';

import { AuthControllerModule } from '@/modules/users/presentation/controller/auth.controller.module';
import { GraphqlPersistedModule } from '@/shared/graphql/graphql-persisted.module';
import { MailboxModule } from '@/modules/mailbox/mailbox.module';
import { ConversationModule } from '@/modules/coversation/coversation.module';
import { SocialGraphModule } from '@/modules/social-graph/social-graph.module';
import { SocialActivityModule } from '@/modules/social-activity/social-activity.module';
import { AffinityModule } from '@/modules/affinity/affinity.module';
import { PushNotificationModule } from '@/modules/notification/notification.module';
import { ChatPresenceModule } from '@/modules/chat/chat-presence.module';
import { R2StorageModule } from '@/shared/storage/r2';
import { ProfileModule } from '@/modules/profile/profile.module';
import { ShareSheetModule } from '@/modules/share-sheet/share-sheet.module';
import { RecipientSearchModule } from '@/modules/recipient-search/recipient-search.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    RedisClusterModule,
    JwtModule,
    UsersModule,
    AuthModule,
    SocialGraphModule,
    ProfileModule,
    ShareSheetModule,
    RecipientSearchModule,
    SocialActivityModule,
    AffinityModule,
    PostsModule,
    ConversationModule,
    MessageModule,
    AuthorizationModule,
    OrchestratorsModule,
    AuthControllerModule,
    MiddlewareModule,
    GraphqlPersistedModule,
    MailboxModule,
    SocketGatewayModule,
    PushNotificationModule,
    ChatPresenceModule,
    R2StorageModule,
  ],
})
export class AppModule {}
