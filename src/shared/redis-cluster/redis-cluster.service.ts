import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppLogger } from '@/shared/logger/applogger';
import { RedisClusterClient } from '@/shared/redis-cluster/redis-cluster.clients';
import { Cluster } from 'ioredis';

@Injectable()
export class RedisClusterService implements OnModuleInit {
  private cluster!: Cluster;

  constructor(
    private readonly client: RedisClusterClient,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('RedisClusterService');
  }

  async onModuleInit() {
    try {
      this.cluster = await this.client.getClient();
      await this.cluster.ping();
      this.logger.log('Redis cluster ping successful.');
    } catch (err) {
      this.logger.error('Redis cluster init failed', { error: err });
      throw err;
    }
  }

  get raw(): Cluster {
    return this.cluster;
  }

  async getCluster(): Promise<Cluster> {
    if (this.cluster) return this.cluster;

    this.cluster = await this.client.getClient();
    await this.cluster.ping();

    return this.cluster;
  }

  async createNewClient(): Promise<Cluster> {
    return this.client.createNewClient();
  }

  multi() {
    return this.cluster.multi();
  }

  pipeline() {
    return this.cluster.pipeline();
  }

  getWsConnectionTTL(): number {
    return this.client.getWsConnectionTTL();
  }

  getWsPresenceTTL(): number {
    return this.client.getWsPresenceTTL();
  }

  getWsSocketMetaTTL(): number {
    return this.client.getWsSocketMetaTTL();
  }

  getNodeHeartbeatTTL(): number {
    return this.client.getNodeHeartbeatTTL();
  }
}
