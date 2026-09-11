import { ConversationPersistenceModule } from '@/modules/coversation/infrastructure/repositories/coversation-persistence.module';

import { MessagePersistenceModule } from '@/modules/message/infrastructure/repositories/message-persistence.module';
import { DatabaseModule } from '@/shared/database/database.module';
import { LoggerModule } from '@/shared/logger/logger.module';

import { SnowflakeIdModule } from '@/shared/snowflake-generator/snowflakeId-generator.module';
import { Module } from '@nestjs/common';

import { RedisClusterModule } from '@/shared/redis-cluster/redis-cluster.module';
import { SendFirstMessageUseCase } from '@/modules/message/application/use-cases/send-first-message/send-first-message.usecase';
import { SendNormalMessageUseCase } from '@/modules/message/application/use-cases/send-normal-message/send-normal-message.usecase';
import { CreateMessageMediaUploadUseCase } from '@/modules/message/application/use-cases/media/create-message-media-upload.usecase';
import { MessageContentPreparationService } from '@/modules/message/application/services/message-content-preparation.service';
import { ResumeMessageMediaUploadUseCase } from '@/modules/message/application/use-cases/media/resume-message-media-upload.usecase';
import { GetMessageSendStatusUseCase } from '@/modules/message/application/use-cases/media/get-message-send-status.usecase';
import { MessageMediaCleanupService } from '@/modules/message/application/services/message-media-cleanup.service';

@Module({
  imports: [
    ConversationPersistenceModule,
    SnowflakeIdModule,
    LoggerModule,
    DatabaseModule,
    MessagePersistenceModule,
    RedisClusterModule,
  ],
  providers: [
    SendFirstMessageUseCase,
    SendNormalMessageUseCase,
    CreateMessageMediaUploadUseCase,
    ResumeMessageMediaUploadUseCase,
    GetMessageSendStatusUseCase,
    MessageContentPreparationService,
    MessageMediaCleanupService,
  ],
  exports: [
    SendFirstMessageUseCase,
    SendNormalMessageUseCase,
    CreateMessageMediaUploadUseCase,
    ResumeMessageMediaUploadUseCase,
    GetMessageSendStatusUseCase,
  ],
})
export class SendMessageModule {}
