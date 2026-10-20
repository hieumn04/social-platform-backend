import * as Joi from 'joi';
import { allowedDbTypes } from '../../database/env.database';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(500),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  DB_TYPE: Joi.string()
    .valid(...allowedDbTypes)
    .default('mysql'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),

  TYPEORM_SYNC: Joi.boolean().default(false),
  TYPEORM_LOG: Joi.boolean().default(false),

  ELASTICSEARCH_ENABLED: Joi.boolean().default(false),
  ELASTICSEARCH_READ_ENABLED: Joi.boolean()
    .default(false)
    .when('ELASTICSEARCH_ENABLED', {
      is: false,
      then: Joi.valid(false).messages({
        'any.only':
          'ELASTICSEARCH_READ_ENABLED requires ELASTICSEARCH_ENABLED=true',
      }),
    }),
  ELASTICSEARCH_NODE: Joi.string().uri().default('http://localhost:9200'),
  ELASTICSEARCH_USERNAME: Joi.string().allow('').optional(),
  ELASTICSEARCH_PASSWORD: Joi.string().allow('').optional(),
  ELASTICSEARCH_USER_INDEX_BASE: Joi.string()
    .pattern(/^[a-z0-9_-]+$/)
    .default('user_directory_search'),
  ELASTICSEARCH_USER_INDEX_VERSION: Joi.number().integer().min(1).default(1),
  ELASTICSEARCH_OUTBOX_POLL_MS: Joi.number().integer().min(250).default(1000),
  ELASTICSEARCH_OUTBOX_BATCH_SIZE: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(200),

  ACCESS_TOKEN_SECRET: Joi.string().required(),
  OTP_HMAC_SECRET: Joi.string().min(32).optional(),
  ACCESS_TOKEN_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhdwy]$/)
    .default('15m'),

  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhdwy]$/)
    .default('7d'),
  SESSION_TOKEN_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhdwy]$/)
    .default('7d'),

  TOKEN_ISSUER: Joi.string().uri().default('http://localhost:3000'),
  TOKEN_AUDIENCE: Joi.string().uri().default('http://localhost:3000'),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  WS_CONNECTION_TTL: Joi.string().allow('').optional(),

  WS_PATH: Joi.string().required(),
  WS_NAMESPACE: Joi.string().required(),
  WS_CORS_ORIGINS: Joi.string().required(),
  WS_PING_INTERVAL: Joi.number().default(30000),
  WS_PING_TIMEOUT: Joi.number().default(60000),
  WS_PRESENCE_TTL: Joi.number().default(30000),
  WS_SOCKET_META_TTL: Joi.number().default(30000),
  WS_NODES_TTL: Joi.number().default(30000),
  WS_NODE_HEARTBEAT_TTL: Joi.number().default(30000),

  REDIS_CACHE_DB: Joi.number().integer().min(0).default(0),
  REDIS_SESSION_DB: Joi.number().integer().min(0).default(1),
  REDIS_QUEUE_DB: Joi.number().integer().min(0).default(2),
  REDIS_TOKEN_DB: Joi.number().integer().min(0).default(3),

  REDIS_CLUSTER_NODES: Joi.string().required(),
  REDIS_CLUSTER_PASSWORD: Joi.string().required(),
  RECENT_MESSAGE_CACHE_TTL_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(3600)
    .default(900),

  SENDGRID_API_KEY: Joi.string()
    .required()
    .pattern(/^SG\.[\w-]+\.[\w-]+$/)
    .messages({
      'string.pattern.base':
        'SENDGRID_API_KEY must be a valid SendGrid API key',
      'any.required': 'SENDGRID_API_KEY is required',
    }),

  SENDGRID_SENDER_EMAIL: Joi.string().email().required().messages({
    'string.email': 'SENDGRID_SENDER_EMAIL must be a valid email address',
    'any.required': 'SENDGRID_SENDER_EMAIL is required',
  }),

  SENDGRID_SENDER_NAME: Joi.string().min(1).max(100).required().messages({
    'string.min': 'SENDGRID_SENDER_NAME must be at least 1 character',
    'string.max': 'SENDGRID_SENDER_NAME must be at most 100 characters',
    'any.required': 'SENDGRID_SENDER_NAME is required',
  }),

  SENDGRID_REPLY_TO: Joi.string().email().required().messages({
    'string.email': 'SENDGRID_REPLY_TO must be a valid email address',
    'any.required': 'SENDGRID_REPLY_TO is required',
  }),

  GMAIL_USER: Joi.string().email().required().messages({
    'string.email': 'GMAIL_USER must be a valid Gmail address',
    'any.required': 'GMAIL_USER is required',
  }),

  GMAIL_APP_PASSWORD: Joi.string()
    .pattern(/^[a-zA-Z0-9]{16}$/)
    .required()
    .messages({
      'string.pattern.base':
        'GMAIL_APP_PASSWORD must be a 16-character app password (letters and digits only)',
      'any.required': 'GMAIL_APP_PASSWORD is required',
    }),

  GMAIL_SENDER_NAME: Joi.string().min(1).max(100).required().messages({
    'string.min': 'GMAIL_SENDER_NAME must be at least 1 character',
    'string.max': 'GMAIL_SENDER_NAME must be at most 100 characters',
    'any.required': 'GMAIL_SENDER_NAME is required',
  }),

  RABBITMQ_USER: Joi.string().required(),
  RABBITMQ_PASS: Joi.string().required(),
  RABBITMQ_VHOST: Joi.string().required(),
  RABBITMQ_HOST: Joi.string().required(),
  RABBITMQ_PORT: Joi.number().default(5672),

  RABBITMQ_PREFETCH_CHAT_1ON1: Joi.number().min(1).default(20),
  RABBITMQ_PREFETCH_CHAT_GROUP: Joi.number().min(1).default(20),
  RABBITMQ_PREFETCH_CHAT_NOTIFICATION: Joi.number().min(1).default(50),

  RABBITMQ_RETRY_CHAT_1ON1: Joi.number().min(0).default(3),
  RABBITMQ_RETRY_CHAT_GROUP: Joi.number().min(0).default(3),
  RABBITMQ_RETRY_CHAT_NOTIFICATION: Joi.number().min(0).default(5),

  WORKER_ID: Joi.number().min(1).default(50),

  VAPID_SUBJECT: Joi.string().required(),
  VAPID_PUBLIC_KEY: Joi.string().required(),
  VAPID_PRIVATE_KEY: Joi.string().required(),

  R2_ACCOUNT_ID: Joi.string()
    .trim()
    .pattern(/^[a-fA-F0-9]{32}$/)
    .required(),
  R2_ENDPOINT: Joi.string()
    .uri({ scheme: ['https'] })
    .required(),
  R2_BUCKET_NAME: Joi.string().trim().min(1).required(),
  R2_ACCESS_KEY_ID: Joi.string().trim().min(1).required(),
  R2_SECRET_ACCESS_KEY: Joi.string().trim().min(1).required(),
  R2_UPLOAD_URL_EXPIRATION_MINUTES: Joi.number()
    .integer()
    .min(1)
    .max(10080)
    .default(15),
  R2_PLAYBACK_URL_EXPIRATION_MINUTES: Joi.number()
    .integer()
    .min(1)
    .max(10080)
    .default(60),
  R2_PUBLIC_URL: Joi.string()
    .uri({ scheme: ['https'] })
    .allow('')
    .optional(),
});
