import { Module } from '@nestjs/common';

import { SendOtpEmailUseCase } from './send-otp-email.usecase';
import { SendgridModule } from 'src/shared/sendgrid/sendgrid.module';

@Module({
  imports: [SendgridModule],
  providers: [SendOtpEmailUseCase],
  exports: [SendOtpEmailUseCase],
})
export class SendOtpEmailModule {}
