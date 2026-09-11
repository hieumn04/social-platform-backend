export type FlushHandler<T> = (items: T[]) => Promise<void>;

export interface FlushBufferOptions {
  flushIntervalMs?: number;
  maxBatchSize?: number;
}
