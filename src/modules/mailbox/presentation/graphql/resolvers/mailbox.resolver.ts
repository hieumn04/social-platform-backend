import { GetSlideMailBoxForIrisSubscriptionUseCase } from '@/modules/coversation/application/use-cases/getslidemailbox/get_slide_mailbox_for_iris_subscription.usecase';
import { TypeormMailboxEventRepository } from '@/modules/mailbox/infrastructure/repositories/typeorm-mailbox-event.repository';
import { MailboxEventRawMapper } from '@/modules/mailbox/infrastructure/mappers/mailbox-event.mapper';
import { Inject } from '@nestjs/common';
import { Context, Query, Resolver, Args } from '@nestjs/graphql';

@Resolver('Query')
export class MailboxResolver {
  constructor(
    private readonly getSlideMailBoxForIrisSubscriptionUseCase: GetSlideMailBoxForIrisSubscriptionUseCase,
    private readonly mailboxEventRepo: TypeormMailboxEventRepository,
  ) { }

  @Query('get_slide_mailbox_for_iris_subscription')
  async getMailbox(
    @Context() ctx: any,
    @Args('device_id_for_iris_subscription') deviceId: string,
  ) {
    const userId = ctx.user.sub || ctx.user.id;

    // 1. Get seq from mailbox events
    // const seq = await this.mailboxEventRepo.getLatestSeq(userId);

    // 2. Get mailbox threads
    const mailboxData =
      await this.getSlideMailBoxForIrisSubscriptionUseCase.execute(userId);

    // 3. Combine
    return {
      __typename: 'SlideMailbox',
      iris_inactive_subscription_uq_seq_id: '0',
      unread_thread_count: mailboxData.unread_thread_count,
      unread_state_seq: mailboxData.unread_state_seq,
      threads_by_folder: mailboxData.threads_by_folder,
      pinned_threads_v2: [],
    };
  }

  @Query('get_unread_thread_summary')
  async getUnreadThreadSummary(@Context() ctx: any) {
    const userId = ctx.user.sub || ctx.user.id;

    return this.getSlideMailBoxForIrisSubscriptionUseCase.getUnreadSummary(userId);
  }

  @Query('get_mailbox_events_after_seq')
  async getEventsAfterSeq(
    @Context() ctx: any,
    @Args('since_seq') sinceSeq: string,
    @Args('limit') limit?: number,
  ) {
    const userId = ctx.user.sub || ctx.user.id;
    const rawEvents = await this.mailboxEventRepo.getEventsAfterSeq(userId, sinceSeq, limit || 50);
    const events = MailboxEventRawMapper.fromRows(rawEvents);
    return events.map((event) => ({
      ...event,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    }));
  }
}
