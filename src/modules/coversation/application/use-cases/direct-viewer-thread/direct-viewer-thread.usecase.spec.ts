import { NotFoundException } from '@nestjs/common';
import { DirectViewerThreadUseCase } from './direct-viewer-thread.usecase';

describe('DirectViewerThreadUseCase', () => {
  const createUseCase = (thread: any) => {
    const logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;
    const inboxRepo = {
      findByViewerAndThreadFbId: jest.fn().mockResolvedValue(thread),
    } as any;
    const participantRepo = {
      getParticipantsByConversationId: jest.fn().mockResolvedValue([
        { conversation_id: 'conversation-1', user_id: 'viewer-1' },
        { conversation_id: 'conversation-1', user_id: 'user-2' },
      ]),
    } as any;
    const cache = {
      getParticipants: jest.fn().mockResolvedValue([]),
      setParticipants: jest.fn().mockResolvedValue(undefined),
      setConversationId: jest.fn().mockResolvedValue(undefined),
    } as any;
    const messageConnection = {
      executePage: jest.fn().mockResolvedValue({
        edges: [
          {
            cursor: 'cursor',
            node: {
              id: 'message-1',
              sender_fbid: 'user-2',
              timestamp_ms: '200',
            },
          },
        ],
        page_info: {
          has_next_page: false,
          has_previous_page: false,
        },
      }),
    } as any;
    const watermarkRepo = { getWatermarks: jest.fn() } as any;
    const watermarkCache = {
      getAll: jest.fn().mockResolvedValue([
        {
          participantId: 'viewer-1',
          deliveryWatermarkTimestampMs: '100',
          readWatermarkTimestampMs: '100',
        },
      ]),
    } as any;
    const userRepo = {
      findProfilesByIds: jest.fn().mockResolvedValue([
        {
          user_id: 'viewer-1',
          username: 'viewer',
          full_name: 'Viewer',
          avatar_url: null,
          fbid_v2: 'fb-viewer',
        },
        {
          user_id: 'user-2',
          username: 'friend',
          full_name: 'Friend',
          avatar_url: 'avatar',
          fbid_v2: 'fb-friend',
          is_verified: false,
        },
      ]),
    } as any;
    const blockRepo = {
      findBlockedTargets: jest.fn().mockResolvedValue(new Set()),
    } as any;
    const restrictRepo = {
      findRestrictedTargets: jest.fn().mockResolvedValue(new Set()),
    } as any;

    return {
      inboxRepo,
      messageConnection,
      useCase: new DirectViewerThreadUseCase(
        logger,
        inboxRepo,
        participantRepo,
        cache,
        messageConnection,
        watermarkRepo,
        watermarkCache,
        userRepo,
        blockRepo,
        restrictRepo,
      ),
    };
  };

  it('returns thread metadata, users, initial messages and page info together', async () => {
    const { useCase, messageConnection } = createUseCase({
      thread_fbid: 'thread-1',
      conversation_id: 'conversation-1',
      thread_key: 'key-1',
      thread_subtype: 'ONE_TO_ONE',
      display_name: null,
      display_avatar_url: null,
      system_folder: 'INBOX',
      reachability_status: 'REACHABLE',
      marked_as_unread: true,
      last_activity_at: new Date(200),
    });

    const result = await useCase.execute('viewer-1', 'thread-1', {
      messageCount: 20,
    });

    expect(messageConnection.executePage).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      threadFbid: 'thread-1',
      before: undefined,
      limit: 20,
    });
    expect(result?.as_ig_direct_thread.users[0].id).toBe('user-2');
    expect(result?.as_ig_direct_thread.slide_messages.edges).toHaveLength(1);
    expect(result?.as_ig_direct_thread.marked_as_unread).toBe(true);
  });

  it('rejects a thread that does not belong to the viewer', async () => {
    const { useCase, messageConnection } = createUseCase(null);

    await expect(
      useCase.execute('viewer-1', 'unknown-thread'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(messageConnection.executePage).not.toHaveBeenCalled();
  });
});
