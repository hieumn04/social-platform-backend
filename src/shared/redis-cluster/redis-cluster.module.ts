import { Module } from '@nestjs/common';
import { RedisClusterService } from '@/shared/redis-cluster/redis-cluster.service';
import { RedisClusterClient } from '@/shared/redis-cluster/redis-cluster.clients';
import { RedisStreamService } from '@/shared/redis-cluster/redis-stream.service';
import { LoggerModule } from '@/shared/logger/logger.module';
import { ConfigModule } from '@/shared/config/config.module';
import { ConversationCacheService } from '@/shared/redis-cluster/conversation/coversation-cache-service';
import { InboxOrderingCacheService } from '@/shared/redis-cluster/conversation/services/inbox-ordering-cache.service';
import { WatermarkCacheService } from '@/shared/redis-cluster/conversation/services/watermark-cache.service';
import { RecentMessageCacheService } from '@/shared/redis-cluster/conversation/services/recent-message-cache.service';
import { UnreadStateVersionService } from '@/shared/redis-cluster/unread-state-version.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    RedisClusterClient,
    RedisClusterService,
    RedisStreamService,
    ConversationCacheService,
    InboxOrderingCacheService,
    WatermarkCacheService,
    RecentMessageCacheService,
    UnreadStateVersionService,
  ],
  exports: [
    RedisClusterClient,
    RedisClusterService,
    RedisStreamService,
    ConversationCacheService,
    InboxOrderingCacheService,
    WatermarkCacheService,
    RecentMessageCacheService,
    UnreadStateVersionService,
  ],
})
export class RedisClusterModule {}
