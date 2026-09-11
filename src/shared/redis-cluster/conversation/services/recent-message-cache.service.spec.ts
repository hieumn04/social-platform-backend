import { RecentMessageCacheService } from './recent-message-cache.service';

describe('RecentMessageCacheService', () => {
  const logger = {
    setContext: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as any;

  it('does not return a cached page when its generation changed mid-read', async () => {
    const pipeline = {
      get: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, JSON.stringify([{ message_id: '10' }])],
        [null, '8'],
      ]),
    };
    const redis = {
      raw: { get: jest.fn().mockResolvedValue('7') },
      pipeline: jest.fn().mockReturnValue(pipeline),
    } as any;
    const service = new RecentMessageCacheService(redis, logger);

    await expect(service.getLatest('conversation-1', 21)).resolves.toEqual({
      rows: null,
      generation: '8',
    });
  });

  it('increments the generation after a committed message write', async () => {
    const multi = {
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    const redis = { multi: jest.fn().mockReturnValue(multi) } as any;
    const service = new RecentMessageCacheService(redis, logger);

    await service.invalidate('conversation-1');

    expect(multi.incr).toHaveBeenCalledWith(
      'messages:{conversation-1}:generation',
    );
    expect(multi.expire).toHaveBeenCalledWith(
      'messages:{conversation-1}:generation',
      7 * 24 * 60 * 60,
    );
  });

  it('uses the configured latest-page TTL when caching messages', async () => {
    const previousTtl = process.env.RECENT_MESSAGE_CACHE_TTL_SECONDS;
    process.env.RECENT_MESSAGE_CACHE_TTL_SECONDS = '900';
    const evalCommand = jest.fn().mockResolvedValue(1);
    const redis = { raw: { eval: evalCommand } } as any;

    try {
      const service = new RecentMessageCacheService(redis, logger);
      await service.setLatestIfGenerationMatches(
        'conversation-1',
        21,
        '4',
        [{ message_id: '10' }] as any,
      );

      expect(evalCommand).toHaveBeenCalledWith(
        expect.any(String),
        2,
        'messages:{conversation-1}:generation',
        'messages:{conversation-1}:latest:4:21',
        '4',
        expect.any(String),
        '900',
      );
    } finally {
      if (previousTtl === undefined) {
        delete process.env.RECENT_MESSAGE_CACHE_TTL_SECONDS;
      } else {
        process.env.RECENT_MESSAGE_CACHE_TTL_SECONDS = previousTtl;
      }
    }
  });
});
