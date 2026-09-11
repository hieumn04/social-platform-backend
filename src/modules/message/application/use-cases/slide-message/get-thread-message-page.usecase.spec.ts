import { NotFoundException } from '@nestjs/common';
import { GetThreadMessagePageUseCase } from './get-thread-message-page.usecase';

describe('GetThreadMessagePageUseCase', () => {
  it('does not load messages when the viewer does not own the thread', async () => {
    const inboxRepo = {
      findByViewerAndThreadFbId: jest.fn().mockResolvedValue(null),
    } as any;
    const messageConnection = { executePage: jest.fn() } as any;
    const useCase = new GetThreadMessagePageUseCase(
      inboxRepo,
      messageConnection,
    );

    await expect(
      useCase.execute({
        viewerId: 'viewer-1',
        threadFbid: 'thread-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(messageConnection.executePage).not.toHaveBeenCalled();
  });

  it('uses the internal conversation id only after authorization', async () => {
    const inboxRepo = {
      findByViewerAndThreadFbId: jest.fn().mockResolvedValue({
        conversation_id: 'conversation-1',
      }),
    } as any;
    const connection = { edges: [], page_info: { has_next_page: false } };
    const messageConnection = {
      executePage: jest.fn().mockResolvedValue(connection),
    } as any;
    const useCase = new GetThreadMessagePageUseCase(
      inboxRepo,
      messageConnection,
    );

    await expect(
      useCase.execute({
        viewerId: 'viewer-1',
        threadFbid: 'thread-1',
        before: 'cursor',
        first: 20,
      }),
    ).resolves.toBe(connection);
    expect(messageConnection.executePage).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      threadFbid: 'thread-1',
      before: 'cursor',
      limit: 20,
    });
  });
});
