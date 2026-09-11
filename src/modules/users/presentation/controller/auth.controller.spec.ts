import { Gender } from '@/shared/enums/gender.enum';
import { Method } from '@/shared/enums/statusRegister.enum';
import { SendOtpOutput } from '@/modules/users/application/use-cases/register/send-otp.output';
import { AuthController } from './auth.controller';

describe('AuthController signup cookie contract', () => {
  it('sets an HttpOnly cookie and never exposes the session token', async () => {
    const sendOtpUseCase = {
      execute: jest.fn().mockResolvedValue(
        new SendOtpOutput(
          true,
          'OTP email sent successfully',
          'secret-browser-token',
          'ca*******@example.com',
          '2026-09-11T12:10:00.000Z',
          600,
          60,
        ),
      ),
    };
    const controller = new AuthController(
      sendOtpUseCase as never,
      {} as never,
      {} as never,
    );
    const response = { cookie: jest.fn() };

    const result = await controller.requestOtp(
      {
        fullName: 'Candidate User',
        username: 'candidate',
        password: 'Strong@123',
        email: 'candidate@example.com',
        gender: Gender.OTHER,
        purpose: Method.REGISTER,
      },
      { ip: '127.0.0.1', deviceId: 'device-1' } as never,
      response as never,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'signup_session',
      'secret-browser-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/auth/otp',
        maxAge: 600_000,
      }),
    );
    expect(result).not.toHaveProperty('sessionToken');
    expect(result).not.toHaveProperty('jti');
  });
});
