export interface RedisClusterNode {
  host: string;
  port: number;
}

export interface RedisClusterConfig {
  nodes: RedisClusterNode[];
  password?: string;
  wsConnectionTTL: number;
  wsPresenceTTL: number;
  wsSocketMetaTTL: number;
  wsNodesTTL: number;
  wsNodeHeartbeatTTL: number;
}
