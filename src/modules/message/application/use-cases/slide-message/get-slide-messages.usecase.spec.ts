import { BadRequestException } from '@nestjs/common';
import { GetSlideMessageConnectionUseCase } from './get-slide-messages.usecase';
import { encodeMessageCursor } from '@/shared/graphql/message-cursor';

describe('GetSlideMessageConnectionUseCase.executePage', () => {
  const row = (id: string) => ({
    message_id: id,
    client_context: `client-${id}`,
    thread_id: 'conversation-1',
    sender_fbid: 'user-2',
    content_type: 'TEXT',
    text_body: `message-${id}`,
    igd_snippet: `message-${id}`,
    timestamp_ms: Number(id),
    expiration_timestamp_ms: null,
    view_expiration_timestamp_ms: null,
    reply_to_message_id: null,
    payload: null,
  });

  const logger = {
    setContext: jest.fn(),
  } as any;

  it('returns a bounded initial page and Relay-compatible cursors', async () => {
    const messageRepo = {
      findLatestMessagesByThread: jest
        .fn()
        .mockResolvedValue([row('30'), row('20'), row('10')]),
      findMessagesBeforeCursor: jest.fn(),
    } as any;
    const useCase = new GetSlideMessageConnectionUseCase(messageRepo, logger);

    const result = await useCase.executePage({
      conversationId: 'conversation-1',
      threadFbid: 'thread-1',
      limit: 2,
    });

    expect(messageRepo.findLatestMessagesByThread).toHaveBeenCalledWith(
      'conversation-1',
      3,
    );
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0].node.thread_fbid).toBe('thread-1');
    expect(result.page_info).toEqual({
      has_next_page: true,
      has_previous_page: false,
      start_cursor: encodeMessageCursor('30'),
      end_cursor: encodeMessageCursor('20'),
    });
  });

  it('uses the Redis latest-page cache without querying MySQL', async () => {
    const messageRepo = {
      findLatestMessagesByThread: jest.fn(),
      findMessagesBeforeCursor: jest.fn(),
    } as any;
    const recentMessageCache = {
      getLatest: jest.fn().mockResolvedValue({
        rows: [row('30'), row('20')],
        generation: '4',
      }),
      setLatestIfGenerationMatches: jest.fn(),
    } as any;
    const useCase = new GetSlideMessageConnectionUseCase(
      messageRepo,
      logger,
      recentMessageCache,
    );

    const result = await useCase.executePage({
      conversationId: 'conversation-1',
      threadFbid: 'thread-1',
      limit: 2,
    });

    expect(result.edges.map((edge) => edge.node.message_id)).toEqual([
      '30',
      '20',
    ]);
    expect(messageRepo.findLatestMessagesByThread).not.toHaveBeenCalled();
  });

  it('decodes before and loads only older messages', async () => {
    const messageRepo = {
      findLatestMessagesByThread: jest.fn(),
      findMessagesBeforeCursor: jest.fn().mockResolvedValue([row('10')]),
    } as any;
    const useCase = new GetSlideMessageConnectionUseCase(messageRepo, logger);

    const result = await useCase.executePage({
      conversationId: 'conversation-1',
      threadFbid: 'thread-1',
      before: encodeMessageCursor('20'),
      limit: 2,
    });

    expect(messageRepo.findMessagesBeforeCursor).toHaveBeenCalledWith(
      'conversation-1',
      '20',
      3,
    );
    expect(result.page_info.has_previous_page).toBe(true);
    expect(result.page_info.has_next_page).toBe(false);
  });

  it('rejects a cursor that does not contain a numeric message id', async () => {
    const useCase = new GetSlideMessageConnectionUseCase({} as any, logger);

    await expect(
      useCase.executePage({
        conversationId: 'conversation-1',
        threadFbid: 'thread-1',
        before: Buffer.from('not-a-message-id').toString('base64url'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
