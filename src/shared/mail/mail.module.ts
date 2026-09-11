import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { MailService } from './mail.service';

@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
