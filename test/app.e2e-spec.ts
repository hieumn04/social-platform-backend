import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { VerifyOtpOutput } from '@/application/orchestrators/usecases/verifyOtp-and-register-user/verifyotp.output';
import { VerifyOtpAndRegisterUserUseCase } from '@/application/orchestrators/usecases/verifyOtp-and-register-user/verifyotp-and-register-user.useCase';
import { CheckUsernameAvailabilityUseCase } from '@/modules/users/application/use-cases/register/check-username-availability/check-username-availability.usecase';
import { SendOtpOutput } from '@/modules/users/application/use-cases/register/send-otp.output';
import { SendOtpUseCase } from '@/modules/users/application/use-cases/register/send-otp.usecase';
import { AuthController } from '@/modules/users/presentation/controller/auth.controller';
import { Method } from '@/shared/enums/statusRegister.enum';

describe('Signup OTP HTTP contract (e2e)', () => {
  let app: INestApplication;

  const sendOtp = {
    execute: jest.fn(),
    getStatus: jest.fn(),
    resend: jest.fn(),
  };
  const verifyOtp = { execute: jest.fn() };
  const checkUsername = { execute: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: SendOtpUseCase, useValue: sendOtp },
        { provide: VerifyOtpAndRegisterUserUseCase, useValue: verifyOtp },
        { provide: CheckUsernameAvailabilityUseCase, useValue: checkUsername },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => app.close());

  beforeEach(() => jest.clearAllMocks());

  it('returns public challenge metadata and keeps the session in an HttpOnly cookie', async () => {
    sendOtp.execute.mockResolvedValue(
      new SendOtpOutput(
        true,
        'OTP email sent successfully',
        'server-only-session-token',
        'hi***@example.com',
        '2026-09-12T12:10:00.000Z',
        600,
        60,
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({
        fullName: 'Hieu Nguyen',
        username: 'hieunguyen',
        password: 'StrongPassword123!',
        email: 'hieu@example.com',
        purpose: Method.REGISTER,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      maskedEmail: 'hi***@example.com',
      expiresIn: 600,
      resendAfter: 60,
    });
    expect(response.body).not.toHaveProperty('sessionToken');
    expect(response.body).not.toHaveProperty('jti');

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies[0]).toContain('signup_session=server-only-session-token');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Strict');
  });

  it('reads the signup session from the cookie when verifying the OTP', async () => {
    verifyOtp.execute.mockResolvedValue(
      new VerifyOtpOutput(
        'Account created successfully',
        true,
        Method.REGISTER,
        '329734922971385856',
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/auth/otp/verify-register')
      .set('Cookie', [
        'signup_session=server-only-session-token',
        'deviceId=test-device',
      ])
      .send({ otpEnter: '123456' })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      purpose: Method.REGISTER,
      userId: '329734922971385856',
    });
    expect(verifyOtp.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        otpEnter: '123456',
        sessionToken: 'server-only-session-token',
        deviceId: 'test-device',
      }),
    );
  });
});
