import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Config } from '@/shared/config/r2.config';
import { R2_S3_CLIENT } from './r2.constants';
import {
  PresignedDownloadOptions,
  PresignedUpload,
  PresignedUploadInput,
  R2Object,
  R2ObjectMetadata,
  UploadedObject,
  UploadObjectInput,
} from './r2.types';

@Injectable()
export class R2StorageService {
  constructor(
    @Inject(R2_S3_CLIENT) private readonly client: S3Client,
    @Inject(r2Config.KEY)
    private readonly config: ConfigType<typeof r2Config>,
  ) {}

  async uploadObject(input: UploadObjectInput): Promise<UploadedObject> {
    const key = this.validateKey(input.key);
    const result = await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
        ContentLength: input.contentLength,
        CacheControl: input.cacheControl,
        Metadata: input.metadata,
      }),
    );

    return {
      key,
      etag: result.ETag,
      versionId: result.VersionId,
    };
  }

  async createPresignedUploadUrl(
    input: PresignedUploadInput,
  ): Promise<PresignedUpload> {
    const key = this.validateKey(input.key);
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
      Metadata: input.metadata,
    });
    const expiresIn = Math.max(
      1,
      Math.min(
        this.config.uploadUrlExpirationSeconds,
        input.expiresInSeconds ?? this.config.uploadUrlExpirationSeconds,
      ),
    );
    const headers: Record<string, string> = {};

    if (input.contentType) {
      headers['content-type'] = input.contentType;
    }
    for (const [name, value] of Object.entries(input.metadata ?? {})) {
      headers[`x-amz-meta-${name.toLowerCase()}`] = value;
    }
    const metadataHeaders = Object.keys(headers).filter((name) =>
      name.startsWith('x-amz-meta-'),
    );
    const url = await getSignedUrl(this.client, command, {
      expiresIn,
      signableHeaders: input.contentType
        ? new Set(['content-type'])
        : undefined,
      unhoistableHeaders:
        metadataHeaders.length > 0 ? new Set(metadataHeaders) : undefined,
    });

    return {
      key,
      method: 'PUT',
      url,
      headers,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  async createPresignedDownloadUrl(
    key: string,
    options: PresignedDownloadOptions = {},
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: this.validateKey(key),
      ResponseContentType: options.contentType,
      ResponseContentDisposition: options.contentDisposition,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: this.config.playbackUrlExpirationSeconds,
    });
  }

  async createDeliveryUrl(key: string): Promise<string> {
    if (this.config.publicUrl) {
      return this.getPublicUrl(key);
    }

    return this.createPresignedDownloadUrl(key);
  }

  createPrivateDeliveryUrl(key: string): Promise<string> {
    return this.createPresignedDownloadUrl(key);
  }

  async getObject(key: string): Promise<R2Object> {
    return this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: this.validateKey(key),
      }),
    );
  }

  async getObjectMetadata(key: string): Promise<R2ObjectMetadata> {
    return this.client.send(
      new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: this.validateKey(key),
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: this.validateKey(key),
      }),
    );
  }

  getPublicUrl(key: string): string {
    if (!this.config.publicUrl) {
      throw new Error('R2_PUBLIC_URL is not configured');
    }

    const encodedKey = this.validateKey(key)
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${this.config.publicUrl}/${encodedKey}`;
  }

  private validateKey(key: string): string {
    if (!key || !key.trim()) {
      throw new TypeError('R2 object key must not be empty');
    }
    if (key.includes('\0')) {
      throw new TypeError('R2 object key must not contain null characters');
    }

    return key;
  }
}
