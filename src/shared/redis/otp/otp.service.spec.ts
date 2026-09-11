import { Gender } from '@/shared/enums/gender.enum';
import { Method } from '@/shared/enums/statusRegister.enum';
import { Email } from '@/modules/value-objects/email';
import { Password } from '@/modules/value-objects/password';
import { OtpService } from './otp.service';

describe('OtpService signup challenge', () => {
  const userInfo = {
    email: Email.fromPersistence('candidate@example.com'),
    username: 'candidate',
    fullName: 'Candidate User',
    passwordHash: Password.fromHash(
      '$2b$12$123456789012345678901u12345678901234567890123456789012',
    ),
    gender: Gender.OTHER,
  };

  function setup() {
    const multi = {
      del: jest.fn(),
      hset: jest.fn(),
      expire: jest.fn(),
      set: jest.fn(),
    };
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      multi: jest.fn().mockReturnValue(multi),
      del: jest
        .fn()
        .mockImplementation(
          (_key: string, _type: string, commander?: typeof multi) => {
            if (commander) commander.del(_key);
          },
        ),
      hashSet: jest
        .fn()
        .mockImplementation((_options, commander: typeof multi) => {
          commander.hset();
          commander.expire();
        }),
      set: jest.fn().mockImplementation((_options, commander: typeof multi) => {
        commander.set();
      }),
      execMulti: jest.fn().mockResolvedValue([]),
      hashGetAllFields: jest.fn(),
      hashIncrement: jest.fn().mockResolvedValue(1),
    };
    const config = { jwt: { accessTokenSecret: 'unit-test-secret' } };
    const logger = { setContext: jest.fn(), warn: jest.fn() };
    const service = new OtpService(
      redis as never,
      config as never,
      logger as never,
    );
    return { service, redis };
  }

  it('stores a hashed OTP without a jti and verifies through the opaque session', async () => {
    const { service, redis } = setup();
    const created = await service.createSignupChallenge(
      userInfo,
      Method.REGISTER,
      'device-1',
    );
    const hashCall = redis.hashSet.mock.calls[0][0];
    const stored = hashCall.fields as Record<string, string | number>;
    const challengeKey = hashCall.key as string;

    expect(created.sessionToken).toBeTruthy();
    expect(challengeKey).not.toContain(created.sessionToken);
    expect(stored).not.toHaveProperty('otp');
    expect(stored).not.toHaveProperty('jti');
    expect(stored.otpHash).not.toBe(created.otp);

    redis.hashGetAllFields.mockResolvedValue(stored);
    redis.get.mockResolvedValue(challengeKey);
    const verified = await service.verifySignupChallenge(
      created.sessionToken,
      created.otp,
      'device-1',
    );
    expect(verified.success).toBe(true);
  });

  it('rejects the same cookie when the device binding is different', async () => {
    const { service, redis } = setup();
    const created = await service.createSignupChallenge(
      userInfo,
      Method.REGISTER,
      'device-1',
    );
    const hashCall = redis.hashSet.mock.calls[0][0];
    redis.hashGetAllFields.mockResolvedValue(hashCall.fields);
    redis.get.mockResolvedValue(hashCall.key);

    const verified = await service.verifySignupChallenge(
      created.sessionToken,
      created.otp,
      'device-2',
    );
    expect(verified).toEqual({ success: false, reason: 'DEVICE_MISMATCH' });
  });
});
