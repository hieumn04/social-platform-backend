import { TypeormMailboxEventRepository } from '@/modules/mailbox/infrastructure/repositories/typeorm-mailbox-event.repository';
import { MailboxEventOrmEntity } from '@/modules/mailbox/infrastructure/typeorm/entities/mailbox-event.orm-entity';
import { DatabaseModule } from '@/shared/database/database.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([MailboxEventOrmEntity]),
    DatabaseModule,
    LoggerModule,
  ],
  providers: [TypeormMailboxEventRepository],
  exports: [TypeOrmModule, TypeormMailboxEventRepository],
})
export class MailBoxPersistenceModule {}
