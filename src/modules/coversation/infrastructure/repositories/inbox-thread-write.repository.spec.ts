import { DataSource } from 'typeorm';

import { AppLogger } from '@/shared/logger/applogger';
import {
  ConversationSubtype,
  InboxFolder,
  ReachabilityStatus,
  SystemFolder,
} from '@/shared/enums/roomStatus.enum';
import { InboxThreadWriteRepository } from './inbox-thread-write.repository';

describe('InboxThreadWriteRepository counterparty invariant', () => {
  const query = jest.fn().mockResolvedValue(undefined);
  const logger = {
    setContext: jest.fn(),
    debug: jest.fn(),
  } as unknown as AppLogger;
  const repository = new InboxThreadWriteRepository(
    { query } as unknown as DataSource,
    logger,
  );

  beforeEach(() => query.mockClear());

  it('rejects a Direct projection without a counterparty', async () => {
    await expect(
      repository.upsertWithLastMessageBulk([directItem()]),
    ).rejects.toThrow('requires counterpartyUserId');
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects a Group projection with a counterparty', async () => {
    await expect(
      repository.upsertWithLastMessageBulk([
        {
          ...directItem(),
          threadSubtype: ConversationSubtype.GROUP,
          counterpartyUserId: '20',
        },
      ]),
    ).rejects.toThrow('must not have counterpartyUserId');
    expect(query).not.toHaveBeenCalled();
  });

  it('writes the Direct counterparty into the projection', async () => {
    await repository.upsertWithLastMessageBulk([
      { ...directItem(), counterpartyUserId: '20' },
    ]);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain('counterparty_user_id');
    expect(query.mock.calls[0][1][2]).toBe('20');
  });
});

function directItem() {
  return {
    id: '1',
    viewerId: '10',
    threadFbid: '100',
    conversationId: '200',
    threadKey: '300',
    threadSubtype: ConversationSubtype.ONE_TO_ONE,
    folder: InboxFolder.PRIMARY,
    systemFolder: SystemFolder.INBOX,
    reachabilityStatus: ReachabilityStatus.REACHABLE,
    lastMessageId: '400',
    lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
    isSender: true,
  };
}
