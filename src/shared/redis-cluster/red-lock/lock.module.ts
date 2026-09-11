import { LockService } from '@/shared/redis-cluster/red-lock/lock.service';
import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [RedisClusterModule],
  providers: [LockService],
  exports: [LockService],
})
export class LockModule {}
