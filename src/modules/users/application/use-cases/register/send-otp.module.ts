import { Module } from '@nestjs/common';

import { LoggerModule } from '@/shared/logger/logger.module';
import { OtpModule } from '@/shared/redis/otp/otp.module';
import { SendOtpEmailModule } from './send-otp-email-bymail/send-otp-email-byemail.module';
import { ValidateInputUserModule } from './validate-input-user.ts/validate-input-user.module';
import { SendOtpUseCase } from './send-otp.usecase';

@Module({
  imports: [
    ValidateInputUserModule,
    OtpModule,
    SendOtpEmailModule,
    LoggerModule,
  ],
  providers: [SendOtpUseCase],
  exports: [SendOtpUseCase],
})
export class SendOtpModule {}
