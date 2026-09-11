import { ThreadIdHasher } from '@/modules/coversation/application/port/service/thread-id-hasher.interface';
import { NestConfigService } from '@/shared/config/config.service';
import { createHmac } from 'crypto';

export class HmacThreadIdHasher implements ThreadIdHasher {
  constructor(private readonly configService: NestConfigService) {}

  hash(value: string): string {
    return createHmac('sha256', this.configService.jwt.accessTokenSecret)
      .update(value)
      .digest('hex');
  }
}
