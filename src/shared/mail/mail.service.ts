import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppLogger } from '../logger/applogger';
import { NestConfigService } from '../config/config.service';
import { SendMailParams } from 'src/types/sendgrid/email-sender.port';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly logger: AppLogger,
    private readonly configService: NestConfigService,
  ) {
    this.logger.setContext(MailService.name);

    const senderEmail = this.configService.mail.senderEmail;
    const appPassword = this.configService.mail.appPassword;

    if (!senderEmail || !appPassword) {
      this.logger.error('Missing Gmail credentials in configuration');
      throw new Error('Missing Gmail credentials in configuration');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    this.logger.debug(`✅ Mail transporter initialized for: ${senderEmail}`);
  }

  async sendMail(params: SendMailParams): Promise<void> {
    const { to, subject, html, text } = params;
    const { senderEmail, senderName, replyTo } = this.configService.mail;

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html,
      text,
      replyTo,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        ` Email sent successfully to "${to}"  with subject "${subject}" `,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(` Failed to send email to "${to}" → ${err.message}`);
      throw err;
    }
  }

  async verifyTransporter(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.debug(' Mail transporter verified and ready.');
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        ` Mail transporter verification failed: ${err.message}`,
      );
      throw err;
    }
  }
}
