import { ConfigType } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Config } from '@/shared/config/r2.config';
import { R2StorageService } from './r2-storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('R2StorageService', () => {
  const config = {
    accountId: '1234567890abcdef1234567890abcdef',
    endpoint:
      'https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com',
    bucketName: 'test-bucket',
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
    uploadUrlExpirationSeconds: 900,
    playbackUrlExpirationSeconds: 3600,
    publicUrl: 'https://public.example.test',
  } as ConfigType<typeof r2Config>;

  let send: jest.Mock;
  let service: R2StorageService;

  beforeEach(() => {
    send = jest.fn();
    service = new R2StorageService({ send } as unknown as S3Client, config);
    jest.clearAllMocks();
  });

  it('uploads an object to the configured bucket', async () => {
    send.mockResolvedValue({ ETag: 'etag', VersionId: 'version-id' });

    const result = await service.uploadObject({
      key: 'avatars/user 1.png',
      body: Buffer.from('image'),
      contentType: 'image/png',
    });

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: 'test-bucket',
      Key: 'avatars/user 1.png',
      ContentType: 'image/png',
    });
    expect(result).toEqual({
      key: 'avatars/user 1.png',
      etag: 'etag',
      versionId: 'version-id',
    });
  });

  it('creates a presigned upload response with required headers', async () => {
    jest.mocked(getSignedUrl).mockResolvedValue('https://signed.example.test');

    const result = await service.createPresignedUploadUrl({
      key: 'posts/photo.png',
      contentType: 'image/png',
      metadata: { Owner: '42' },
    });

    expect(result).toMatchObject({
      key: 'posts/photo.png',
      method: 'PUT',
      url: 'https://signed.example.test',
      headers: {
        'content-type': 'image/png',
        'x-amz-meta-owner': '42',
      },
    });
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(jest.mocked(getSignedUrl)).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(PutObjectCommand),
      expect.objectContaining({
        expiresIn: 900,
        signableHeaders: new Set(['content-type']),
        unhoistableHeaders: new Set(['x-amz-meta-owner']),
      }),
    );
  });

  it('encodes each object-key segment in public URLs', () => {
    expect(service.getPublicUrl('posts/user photo #1.png')).toBe(
      'https://public.example.test/posts/user%20photo%20%231.png',
    );
  });

  it('deletes an object from the configured bucket', async () => {
    send.mockResolvedValue({});

    await service.deleteObject('posts/deleted.png');

    const command = send.mock.calls[0][0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: 'posts/deleted.png',
    });
  });

  it('rejects empty object keys', async () => {
    await expect(
      service.uploadObject({ key: '   ', body: Buffer.from('') }),
    ).rejects.toThrow('R2 object key must not be empty');
    expect(send).not.toHaveBeenCalled();
  });
});
