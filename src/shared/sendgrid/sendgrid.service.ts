import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { NestConfigService } from '../config/config.service';
import { SendMailParams } from 'src/types/sendgrid/email-sender.port';
interface ErrorResponse {
  body: {
    errors: any[];
  };
}
@Injectable()
export class SendgridService {
  private readonly logger = new Logger(SendgridService.name);

  constructor(private readonly configService: NestConfigService) {
    sgMail.setApiKey(this.configService.sendgrid.apiKey);
    this.logger.debug(
      `Using SendGrid API key: ${this.configService.sendgrid.apiKey.slice(0, 5)}***`,
    );
  }

  async sendMail(params: SendMailParams): Promise<void> {
    const { to, subject, html, text } = params;
    const fromEmail = this.configService.sendgrid.senderEmail;
    const fromName = this.configService.sendgrid.senderName;
    const replyTo = this.configService.sendgrid.replyTo;

    const msg: sgMail.MailDataRequired = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      html,
      text,
      replyTo,
    };
    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent to ${to} with subject "${subject}"`);
    } catch (error: unknown) {
      const err = error as Error & { response?: ErrorResponse };
      this.logger.error(`Failed to send email to ${to}`, err.stack);
      if (err.response?.body?.errors) {
        this.logger.error(
          'SendGrid Error Response:',
          JSON.stringify(err.response.body.errors),
        );
      }
      throw new Error('Failed to send email');
    }
  }
}
