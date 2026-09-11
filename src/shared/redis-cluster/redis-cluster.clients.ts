import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cluster, ClusterNode } from 'ioredis';
import { NestConfigService } from '@/shared/config/config.service';
import { AppLogger } from '@/shared/logger/applogger';

@Injectable()
export class RedisClusterClient implements OnModuleDestroy, OnModuleInit {
  private cluster?: Cluster;
  private clusterInitializing?: Promise<Cluster>;

  constructor(
    private readonly config: NestConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RedisClusterClient.name);
  }

  // ---------------- GET CLIENT (singleton-safe) ----------------
  async getClient(): Promise<Cluster> {
    if (this.cluster) return this.cluster;
    if (this.clusterInitializing) return this.clusterInitializing;

    this.clusterInitializing = this.initCluster();

    try {
      this.cluster = await this.clusterInitializing;
      return this.cluster;
    } finally {
      this.clusterInitializing = undefined;
    }
  }

  // ---------------- NEW CLIENT (for blocking commands) ----------------
  async createNewClient(): Promise<Cluster> {
    return this.initCluster();
  }

  // ---------------- INIT CLUSTER ----------------
  private async initCluster(): Promise<Cluster> {
    const seedNodes = this.config.redisCluster.nodes;

    if (!seedNodes || seedNodes.length === 0) {
      throw new Error('REDIS_CLUSTER_NODES is required');
    }

    this.logger.log('Initializing Redis Cluster with seed nodes:');
    seedNodes.forEach((n) => this.logger.log(` → ${n.host}:${n.port}`));

    const cluster = new Cluster(seedNodes as ClusterNode[], {
      lazyConnect: true, // MUST be true if we call cluster.connect() manually later

      enableReadyCheck: true,
      maxRedirections: 3,
      // tránh DNS delay trong Docker
      dnsLookup: (address, callback) => callback(null, address),

      redisOptions: {
        password: this.config.redisCluster.password,
        connectTimeout: 5000,
        maxRetriesPerRequest: 2,
        family: 4,
      },

      slotsRefreshTimeout: 2000,
      slotsRefreshInterval: 10000,

      clusterRetryStrategy: (times) => {
        const delay = Math.min(times * 100, 2000);
        this.logger.warn(`Redis Cluster retry #${times}, delay ${delay}ms`);
        return delay;
      },
    });

    this.registerEvents(cluster);

    this.logger.log('Connecting to Redis Cluster...');

    // tránh treo vô hạn nếu connect lỗi
    await Promise.race([
      cluster.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connect timeout')), 7000),
      ),
    ]);

    await this.waitUntilReady(cluster);

    return cluster;
  }

  // ---------------- WAIT READY ----------------
  private waitUntilReady(cluster: Cluster): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((cluster as any).status === 'ready') {
        this.logger.log('Redis Cluster READY');
        resolve();
        return;
      }

      const onReady = () => {
        this.logger.log('Redis Cluster READY');
        cleanup();
        resolve();
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        cluster.off('ready', onReady);
        cluster.off('error', onError);
      };

      cluster.once('ready', onReady);
      cluster.once('error', onError);
    });
  }

  // ---------------- EVENTS ----------------
  private registerEvents(cluster: Cluster) {
    cluster.on('connect', () =>
      this.logger.log('Redis Cluster socket connecting...'),
    );

    cluster.on('ready', () => this.logger.log('Redis Cluster READY'));

    cluster.on('reconnecting', (delay) =>
      this.logger.warn(`Redis Cluster reconnecting in ${delay}ms`),
    );

    cluster.on('close', () =>
      this.logger.warn('Redis Cluster connection closed'),
    );

    cluster.on('end', () =>
      this.logger.error('Redis Cluster connection ended'),
    );

    cluster.on('node error', (err, node) => {
      this.logger.error('Redis Cluster NODE ERROR', {
        message: err.message,
        host: node?.options?.host,
        port: node?.options?.port,
        role: node?.role,
      });
    });

    cluster.on('error', (err) => {
      this.logger.error('Redis Cluster GENERAL ERROR', err);
    });
  }

  // ---------------- INIT (optional fail-fast) ----------------
  async onModuleInit() {
    // Nếu muốn fail sớm khi Redis lỗi → giữ dòng này
    await this.getClient();
  }

  // ---------------- TTL HELPERS ----------------
  public getWsConnectionTTL(): number {
    return Number(this.config.redisCluster.wsConnectionTTL);
  }

  public getNodeHeartbeatTTL(): number {
    return Number(this.config.redisCluster.wsNodeHeartbeatTTL);
  }

  public getWsPresenceTTL(): number {
    return Number(this.config.redisCluster.wsPresenceTTL);
  }

  public getWsSocketMetaTTL(): number {
    return Number(this.config.redisCluster.wsSocketMetaTTL);
  }

  public getWsNodesTTL(): number {
    return Number(this.config.redisCluster.wsNodesTTL);
  }

  // ---------------- DESTROY ----------------
  async onModuleDestroy() {
    if (!this.cluster) return;

    this.logger.log('Disconnecting Redis Cluster...');
    this.cluster.disconnect();
    this.logger.log('Redis Cluster disconnected');
  }
}
