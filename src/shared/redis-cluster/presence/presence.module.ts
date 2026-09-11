import { Module } from '@nestjs/common';
import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { PresenceService } from '@/shared/redis-cluster/presence/presence.service';

@Module({
  imports: [RedisClusterModule, LoggerModule],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
