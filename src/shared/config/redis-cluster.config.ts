import { requirePositiveInt } from '@/helpers/object';
import {
  RedisClusterConfig,
  RedisClusterNode,
} from '@/types/redis-cluster/redis-cluster.types';
import { registerAs } from '@nestjs/config';
import { getEnv } from 'src/helper/getEnv';

export const redisClusterConfig = registerAs(
  'rediscluster',
  (): RedisClusterConfig => {
    const nodesEnv = getEnv('REDIS_CLUSTER_NODES');
    const nodes: RedisClusterNode[] = nodesEnv.split(',').map((n) => {
      const [host, portStr] = n.split(':');
      const port = parseInt(portStr, 10);
      if (!host || isNaN(port)) {
        throw new Error(`Invalid Redis cluster node: ${n}`);
      }
      return { host, port };
    });

    const password = getEnv('REDIS_CLUSTER_PASSWORD');

    return {
      nodes,
      password,
      wsConnectionTTL: requirePositiveInt('WS_CONNECTION_TTL'),
      wsPresenceTTL: requirePositiveInt('WS_PRESENCE_TTL'),
      wsSocketMetaTTL: requirePositiveInt('WS_SOCKET_META_TTL'),
      wsNodesTTL: requirePositiveInt('WS_NODES_TTL'),
      wsNodeHeartbeatTTL: requirePositiveInt('WS_NODE_HEARTBEAT_TTL'),
    };
  },
);
