import { THREAD_ID_HASHER } from '@/modules/coversation/application/port/service/thread-id-hasher.interface';
import { HmacThreadIdHasher } from '@/modules/coversation/infrastructure/service/crypto/hmac-thread-id-hasher';
import { ConfigModule } from '@/shared/config/config.module';

import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: THREAD_ID_HASHER,
      useClass: HmacThreadIdHasher,
    },
  ],
  exports: [THREAD_ID_HASHER],
})
export class ThreadHasherModule {}
