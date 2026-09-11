import { VerifyOtpAndRegisterUserModule } from '@/application/orchestrators/usecases/verifyOtp-and-register-user/verifyotp-and-register-user.module';
import { SendOtpModule } from '@/modules/users/application/use-cases/register/send-otp.module';
import { UserPersistenceModule } from '@/modules/users/infrastructure/repositories/user-persistence.module';
import { AuthController } from '@/modules/users/presentation/controller/auth.controller';
import { Module } from '@nestjs/common';
import { CheckUsernameAvailabilityUseCase } from '@/modules/users/application/use-cases/register/check-username-availability/check-username-availability.usecase';

@Module({
  imports: [
    SendOtpModule,
    VerifyOtpAndRegisterUserModule,
    UserPersistenceModule,
  ],
  controllers: [AuthController],
  providers: [CheckUsernameAvailabilityUseCase],
})
export class AuthControllerModule {}
