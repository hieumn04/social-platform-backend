import { Module } from '@nestjs/common';

import { MailModule } from 'src/shared/mail/mail.module';
import { SendOtpEmailUseCase } from './send-otp-email-byemail.usecase';

@Module({
  imports: [MailModule],
  providers: [SendOtpEmailUseCase],
  exports: [SendOtpEmailUseCase],
})
export class SendOtpEmailModule {}
