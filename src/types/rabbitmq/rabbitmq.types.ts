import { ConsumeMessage, Options } from 'amqplib';
export interface RabbitMQQueueConfig {
  name: string;
  routingKey: string;
  prefetch: number;
  // dlx: string;
  // prefetch: number;
  // queueOptions?: Options.AssertQueue;
}

export interface RabbitMQUseCaseConfig {
  uri: string;
  exchange: string;
  exchangeType: ExchangeType;
  // exchangeOptions?: Options.AssertExchange;
  queues: RabbitMQQueueConfig[];
  retryAttempts: number;
}

export type MessageCallback<T = any> = (
  payload: T,
  rawMessage: ConsumeMessage,
) => void;

export type ExchangeType = 'direct' | 'topic' | 'fanout' | 'headers';
