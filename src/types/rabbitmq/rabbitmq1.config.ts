import { registerAs } from '@nestjs/config';
import { RabbitMQUseCaseConfig } from './rabbitmq.types';

const buildUri = (): string => {
  const user = process.env.RABBITMQ_USER ?? 'guest';
  const pass = process.env.RABBITMQ_PASS ?? 'guest';
  const host = process.env.RABBITMQ_HOST ?? 'localhost';
  const port = process.env.RABBITMQ_PORT ?? '5672';
  const vhost = process.env.RABBITMQ_VHOST ?? '/';
};

export const rabbitmqConfig = registerAs(
  'rabbitmq',
  (): RabbitMQUseCaseConfig => {
    return {};
  },
);
