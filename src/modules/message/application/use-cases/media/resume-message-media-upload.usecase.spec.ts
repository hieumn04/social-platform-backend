import { ResumeMessageMediaUploadUseCase } from './resume-message-media-upload.usecase';

describe('ResumeMessageMediaUploadUseCase', () => {
  const thread = { conversation_id: 'conversation-1' };
  const upload = {
    upload_id: 'upload-1',
    owner_id: 'viewer-1',
    conversation_id: 'conversation-1',
    object_key: 'direct/conversation-1/viewer-1/upload-1.jpg',
    mime_type: 'image/jpeg',
    size_bytes: '12',
    width: 10,
    height: 20,
    status: 'PENDING' as const,
    attached_message_id: null,
    expires_at: new Date(Date.now() + 60_000),
  };
  const inboxRepo = {
    findByViewerAndThreadFbId: jest.fn(),
  };
  const mediaRepo = {
    findUpload: jest.fn(),
    expirePendingUpload: jest.fn(),
  };
  const storage = {
    getObjectMetadata: jest.fn(),
    createPresignedUploadUrl: jest.fn(),
  };
  const useCase = new ResumeMessageMediaUploadUseCase(
    inboxRepo as never,
    mediaRepo as never,
    storage as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    inboxRepo.findByViewerAndThreadFbId.mockResolvedValue(thread);
    mediaRepo.findUpload.mockResolvedValue(upload);
  });

  it('reuses an object that is already present in R2', async () => {
    storage.getObjectMetadata.mockResolvedValue({
      ContentLength: 12,
      ContentType: 'image/jpeg',
      Metadata: { 'upload-id': 'upload-1', 'owner-id': 'viewer-1' },
    });

    await expect(
      useCase.execute({
        viewerId: 'viewer-1',
        threadFbid: 'thread-1',
        uploadId: 'upload-1',
      }),
    ).resolves.toMatchObject({
      state: 'ALREADY_UPLOADED',
      object_exists: true,
      upload_url: null,
    });
    expect(storage.createPresignedUploadUrl).not.toHaveBeenCalled();
  });

  it('returns a renewed PUT URL when the R2 object does not exist', async () => {
    storage.getObjectMetadata.mockRejectedValue({
      name: 'NotFound',
      $metadata: { httpStatusCode: 404 },
    });
    storage.createPresignedUploadUrl.mockResolvedValue({
      url: 'https://upload.example',
      headers: { 'content-type': 'image/jpeg' },
      expiresAt: new Date(Date.now() + 30_000),
    });

    await expect(
      useCase.execute({
        viewerId: 'viewer-1',
        threadFbid: 'thread-1',
        uploadId: 'upload-1',
      }),
    ).resolves.toMatchObject({
      state: 'NEEDS_UPLOAD',
      object_exists: false,
      upload_url: 'https://upload.example',
    });
  });

  it('does not allow a different owner to resume the upload', async () => {
    mediaRepo.findUpload.mockResolvedValue({ ...upload, owner_id: 'viewer-2' });

    await expect(
      useCase.execute({
        viewerId: 'viewer-1',
        threadFbid: 'thread-1',
        uploadId: 'upload-1',
      }),
    ).rejects.toThrow('Upload session not found');
  });
});
