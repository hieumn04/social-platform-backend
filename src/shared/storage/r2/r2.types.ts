import type {
  GetObjectCommandOutput,
  HeadObjectCommandOutput,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';

export interface UploadObjectInput {
  key: string;
  body: PutObjectCommandInput['Body'];
  contentType?: string;
  contentLength?: number;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface UploadedObject {
  key: string;
  etag?: string;
  versionId?: string;
}

export interface PresignedUploadInput {
  key: string;
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
  expiresInSeconds?: number;
}

export interface PresignedUpload {
  key: string;
  method: 'PUT';
  url: string;
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface PresignedDownloadOptions {
  contentType?: string;
  contentDisposition?: string;
}

export type R2Object = GetObjectCommandOutput;
export type R2ObjectMetadata = HeadObjectCommandOutput;
