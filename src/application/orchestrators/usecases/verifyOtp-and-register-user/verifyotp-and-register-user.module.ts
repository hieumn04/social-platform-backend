import { VerifyOtpAndRegisterUserUseCase } from '@/application/orchestrators/usecases/verifyOtp-and-register-user/verifyotp-and-register-user.useCase';
import { GenerateMessagingIdentityModule } from '@/modules/message/application/use-cases/generate-messaging-Identity/generateMessagingIdentity.module';
import { UserIdentityModule } from '@/modules/users/application/use-cases/create-user-identity/create-user-identity.module';
import { CreateNewUserModule } from '@/modules/users/application/use-cases/register/createnewuser/createNewUser.module';
import { DatabaseModule } from '@/shared/database/database.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { OtpModule } from '@/shared/redis/otp/otp.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    OtpModule,
    CreateNewUserModule,
    UserIdentityModule,
    GenerateMessagingIdentityModule,
    DatabaseModule,
    LoggerModule,
  ],
  providers: [VerifyOtpAndRegisterUserUseCase],
  exports: [VerifyOtpAndRegisterUserUseCase],
})
export class VerifyOtpAndRegisterUserModule {}
