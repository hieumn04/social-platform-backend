import { ConversationParticipantWriteRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant-write.repository';
import { ConversationParticipantRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant.repository';

import { ConversationWriteRepository } from '@/modules/coversation/infrastructure/repositories/conversation-write.repository';
import { InboxThreadWriteRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread-write.repository';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { ConversationParticipantEntity } from '@/modules/coversation/infrastructure/typeorm/conversation-participant.entity';
import { ConversationWatermarkEntity } from '@/modules/coversation/infrastructure/typeorm/conversation-watermark.entity';
import { ConversationEntity } from '@/modules/coversation/infrastructure/typeorm/conversation.entity';
import { InboxThreadEntity } from '@/modules/coversation/infrastructure/typeorm/inbox-thread.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerModule } from 'src/shared/logger/logger.module';
import { ConversationWatermarksRepository } from './conversation-watermarks.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      ConversationParticipantEntity,
      ConversationWatermarkEntity,
      InboxThreadEntity,
    ]),
    LoggerModule,
  ],
  providers: [
    TypeormInboxThreadRepository,
    ConversationParticipantRepository,
    ConversationWatermarksRepository,
    InboxThreadWriteRepository,
    ConversationWriteRepository,
    ConversationParticipantWriteRepository,
  ],
  exports: [
    ConversationParticipantRepository,
    TypeormInboxThreadRepository,
    ConversationWatermarksRepository,
    InboxThreadWriteRepository,
    ConversationWriteRepository,
    ConversationParticipantWriteRepository,
  ],
})
export class ConversationPersistenceModule { }
