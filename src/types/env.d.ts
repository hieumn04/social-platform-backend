declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    DB_TYPE: string;
    DB_HOST: string;
    DB_PORT?: string;
    DB_USERNAME: string;
    DB_PASSWORD?: string;
    DB_NAME: string;

    TYPEORM_SYNC?: 'true' | 'false';
    TYPEORM_LOG?: 'true' | 'false';
    TYPEORM_RETRY_ATTEMPTS?: string;
    TYPEORM_RETRY_DELAY?: string;

    ACCESS_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN?: SignOptions['expiresIn'];

    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRES_IN?: SignOptions['expiresIn'];

    SESSION_TOKEN_EXPIRES_IN?: SignOptions['expiresIn'];

    TOKEN_ISSUER: string;
    TOKEN_AUDIENCE: string;

    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD?: string;
    REDIS_CACHE_DB: string;
    REDIS_SESSION_DB: string;
    REDIS_QUEUE_DB: string;
    REDIS_TOKEN_DB: string;

    REDIS_CLUSTER_NODES: string;
    REDIS_CLUSTER_PASSWORD: string;
    WS_CONNECTION_TTL: string;
    WS_NODES_TTL?: string;

    RATE_LIMIT_WINDOW_MS?: string;
    RATE_LIMIT_MAX?: string;
    OTP_HMAC_SECRET?: string;

    SENDGRID_API_KEY: string;
    SENDGRID_SENDER_EMAIL: string;
    SENDGRID_SENDER_NAME: string;
    SENDGRID_REPLY_TO: string;

    GMAIL_USER: string;
    GMAIL_APP_PASSWORD: string;
    GMAIL_SENDER_NAME: string;

    RABBITMQ_USER: string;
    RABBITMQ_PASS: string;
    RABBITMQ_VHOST: string;
    RABBITMQ_HOST: string;
    RABBITMQ_PORT: string;

    RABBITMQ_PREFETCH_CHAT_1ON1: string;
    RABBITMQ_PREFETCH_CHAT_GROUP: string;
    RABBITMQ_PREFETCH_CHAT_NOTIFICATION: string;

    RABBITMQ_RETRY_CHAT_1ON1: string;
    RABBITMQ_RETRY_CHAT_GROUP: string;
    RABBITMQ_RETRY_CHAT_NOTIFICATION: string;

    WORKER_ID: string;

    R2_ACCOUNT_ID: string;
    R2_ENDPOINT: string;
    R2_BUCKET_NAME: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_UPLOAD_URL_EXPIRATION_MINUTES: string;
    R2_PLAYBACK_URL_EXPIRATION_MINUTES: string;
    R2_PUBLIC_URL?: string;
  }
}
