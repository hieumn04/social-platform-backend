import { Injectable, Logger } from '@nestjs/common';

import { SendOtpEmailInput } from './send-otp-email.input';
import { SendOtpEmailOutput } from './send-otp-email.output';
import { SendgridService } from 'src/shared/sendgrid/sendgrid.service';

@Injectable()
export class SendOtpEmailUseCase {
  private readonly logger = new Logger('SendOtpEmailUseCase');
  constructor(private readonly sendgridService: SendgridService) {}

  async execute(input: SendOtpEmailInput): Promise<SendOtpEmailOutput> {
    const { to, otp, subject, text, html } = input;

    try {
      const htmlContent =
        html ??
        `<div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <p>Xin chào,</p>
    <p>Mã OTP của bạn để xác thực tài khoản là:</p>
    <h2 style="color: #007BFF; font-size: 28px; margin: 20px 0;">${otp}</h2>
    <p style="font-size: 14px; color: #666;">
      Vui lòng không chia sẻ mã này với bất kỳ ai.
    </p>
    <p style="font-size: 14px; color: #666;">
      Mã sẽ hết hạn sau <strong>10 phút</strong>.
    </p>
    <hr style="margin: 30px 0;">
    <p style="font-size: 12px; color: #aaa;">
      Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.
    </p>
  </div>`;
      await this.sendgridService.sendMail({
        to,
        subject,
        text,
        html: htmlContent,
      });
      this.logger.log(`OTP email sent to ${to}`);

      return new SendOtpEmailOutput(true, 'OTP email sent successfully');
    } catch (error: unknown) {
      let errorCode = 'SENDGRID_ERROR';
      if (typeof error === 'object' && error !== null && 'code' in error) {
        errorCode = error.code as string;
      }
      this.logger.error(
        `Failed to send OTP email to ${to}`,
        error instanceof Error ? error.stack : '',
      );
      return new SendOtpEmailOutput(
        false,
        'Failed to send OTP email',
        errorCode,
        false,
      );
    }
  }
}
