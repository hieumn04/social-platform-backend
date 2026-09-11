import { MailBoxPersistenceModule } from '@/modules/mailbox/infrastructure/repositories/mailbox-persistence.module';
import { MailboxResolver } from '@/modules/mailbox/presentation/graphql/resolvers/mailbox.resolver';
import { GetSlideMailBoxForIrisSubscriptionModule } from '@/modules/coversation/application/use-cases/getslidemailbox/get_slide_mailbox_for_iris_subscription.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [MailBoxPersistenceModule, GetSlideMailBoxForIrisSubscriptionModule],
  providers: [MailboxResolver],
})
export class MailboxModule {}
