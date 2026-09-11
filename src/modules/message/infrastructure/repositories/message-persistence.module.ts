import { MessageWriteRepository } from '@/modules/message/infrastructure/repositories/message-write.repository';
import { MessageRepositoryRaw } from '@/modules/message/infrastructure/repositories/message.repository';
import { MessageMediaEntity } from '@/modules/message/infrastructure/typeorm/message-media.entity';
import { MessageReactionEntity } from '@/modules/message/infrastructure/typeorm/message-reactions.entity';
import { MessageEntity } from '@/modules/message/infrastructure/typeorm/message.entity';
import { MessageMediaUploadEntity } from '@/modules/message/infrastructure/typeorm/message-media-upload.entity';
import { MessageMediaRepository } from '@/modules/message/infrastructure/repositories/message-media.repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerModule } from 'src/shared/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageEntity,
      MessageReactionEntity,
      MessageMediaEntity,
      MessageMediaUploadEntity,
    ]),
    LoggerModule,
  ],
  providers: [
    MessageRepositoryRaw,
    MessageWriteRepository,
    MessageMediaRepository,
  ],
  exports: [
    MessageWriteRepository,
    MessageRepositoryRaw,
    MessageMediaRepository,
    TypeOrmModule,
  ],
})
export class MessagePersistenceModule {}
