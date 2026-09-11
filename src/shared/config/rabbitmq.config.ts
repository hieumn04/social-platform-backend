import { registerAs } from '@nestjs/config';
import {
  RabbitMQQueueConfig,
  RabbitMQUseCaseConfig,
} from '@/types/rabbitmq/rabbitmq.types';
import { getEnv } from '@/helper/getEnv';

const useCases = ['chat.1on1', 'chat.group', 'chat.notification'] as const;
type UseCase = (typeof useCases)[number];

const exchangeTypeMap = {
  'chat.1on1': 'direct',
  'chat.group': 'direct',
  'chat.notification': 'fanout',
} as const;

function buildUseCaseConfig(
  useCase: UseCase,
  baseUri: string,
): RabbitMQUseCaseConfig {
  const envKey = useCase.replace(/\./g, '_').toUpperCase();

  const prefetch = Number(getEnv(`RABBITMQ_PREFETCH_${envKey}`));
  const retryAttempts = Number(getEnv(`RABBITMQ_RETRY_${envKey}`));

  const exchangeType = exchangeTypeMap[useCase];
  const exchange = `${useCase}.exchange`;
  const queue = `${useCase}.queue`;
  const routingKey = useCase === 'chat.notification' ? '' : useCase;

  const queueConfig: RabbitMQQueueConfig = {
    name: queue,
    routingKey,
    prefetch,
  };

  return {
    uri: baseUri,
    exchange,
    exchangeType,
    queues: [queueConfig],
    retryAttempts,
  };
}

export default registerAs('rabbitmq', () => {
  const RABBITMQ_USER = getEnv('RABBITMQ_USER');
  const RABBITMQ_PASS = getEnv('RABBITMQ_PASS');
  const RABBITMQ_VHOST = getEnv('RABBITMQ_VHOST');
  const RABBITMQ_HOST = getEnv('RABBITMQ_HOST');
  const RABBITMQ_PORT = getEnv('RABBITMQ_PORT');

  const baseUri = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}/${RABBITMQ_VHOST}`;

  const configs = Object.fromEntries(
    useCases.map((uc) => [uc, buildUseCaseConfig(uc, baseUri)]),
  ) as Record<UseCase, RabbitMQUseCaseConfig>;

  return configs;
});
