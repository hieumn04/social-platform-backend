import { registerAs } from '@nestjs/config';
import { getEnv } from '@/helper/getEnv';

export interface R2Config {
  accountId: string;
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  uploadUrlExpirationSeconds: number;
  playbackUrlExpirationSeconds: number;
  publicUrl?: string;
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const r2Config = registerAs('r2', (): R2Config => {
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();

  return {
    accountId: getEnv('R2_ACCOUNT_ID'),
    endpoint: withoutTrailingSlash(getEnv('R2_ENDPOINT')),
    bucketName: getEnv('R2_BUCKET_NAME'),
    accessKeyId: getEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY'),
    uploadUrlExpirationSeconds:
      Number(getEnv('R2_UPLOAD_URL_EXPIRATION_MINUTES')) * 60,
    playbackUrlExpirationSeconds:
      Number(getEnv('R2_PLAYBACK_URL_EXPIRATION_MINUTES')) * 60,
    publicUrl: publicUrl ? withoutTrailingSlash(publicUrl) : undefined,
  };
});
