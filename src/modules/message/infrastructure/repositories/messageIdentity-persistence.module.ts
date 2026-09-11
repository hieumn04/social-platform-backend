import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/shared/logger/logger.module';

import { MessagingIdentityRepositoryImpl } from '@/modules/message/infrastructure/repositories/messagingIdentity-persistence.repository.impl';
import { MessagingActorEntity } from '@/modules/message/infrastructure/typeorm/messagingIdentity.entity';
import { DatabaseModule } from '@/shared/database/database.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessagingActorEntity]),
    DatabaseModule,
    LoggerModule,
  ],
  providers: [
    {
      provide: 'MessagingIdentityRepository',
      useClass: MessagingIdentityRepositoryImpl,
    },
  ],
  exports: ['MessagingIdentityRepository', TypeOrmModule],
})
export class MessageIdentityPersistenceModule {}
