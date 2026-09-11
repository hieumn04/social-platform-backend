export interface RequestContext {
  requestId: string;
  userId?: string;
  ip?: string;
  deviceId?: string;
  jti?: string;
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface LogMeta {
  [key: string]: any;
  error?: Error;
  traceId?: string;
  tag?: string;
}
