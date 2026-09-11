import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RedisModule } from '../redis.module';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { ConfigModule } from '@/shared/config/config.module';

@Module({
  imports: [RedisModule, LoggerModule, ConfigModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
