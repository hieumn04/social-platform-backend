import { Module } from '@nestjs/common';
import { JwtTokenService } from './jwt-token.service';
import { ConfigModule } from 'src/shared/config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [JwtTokenService],
  exports: [JwtTokenService],
})
export class JwtModule {}
