import { DirectViewerThreadUseCase } from '@/modules/coversation/application/use-cases/direct-viewer-thread/direct-viewer-thread.usecase';
import { MarkSeenUseCase } from '@/modules/coversation/application/use-cases/mark-seen/mark-seen.usecase';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { GetThreadMessagePageUseCase } from '@/modules/message/application/use-cases/slide-message/get-thread-message-page.usecase';

@Resolver('Query')
@UseGuards(JwtAuthGuard)
export class ThreadResolver {
  constructor(
    private readonly directViewerThreadUseCase: DirectViewerThreadUseCase,
    private readonly markSeenUseCase: MarkSeenUseCase,
    private readonly getThreadMessagePageUseCase: GetThreadMessagePageUseCase,
  ) {}

  @Query('get_slide_thread_nullable')
  async get_slide_thread_nullable(
    @Args('threadFbid') legacyThreadFbid: string | undefined,
    @Args('thread_fbid') threadFbid: string | undefined,
    @Args('message_count') messageCount: number | undefined,
    @Args('before') before: string | undefined,
    @Args('min_uq_seq_id') minUqSeqId: string | undefined,
    @Context() ctx: any,
  ) {
    const resolvedThreadFbid = threadFbid ?? legacyThreadFbid;
    if (!resolvedThreadFbid) {
      throw new BadRequestException('thread_fbid is required');
    }

    const userId = ctx.user.sub;
    return this.directViewerThreadUseCase.execute(userId, resolvedThreadFbid, {
      messageCount,
      before,
      minUqSeqId,
    });
  }

  @Query('get_slide_thread_messages')
  async getSlideThreadMessages(
    @Args('thread_fbid') threadFbid: string,
    @Args('first') first: number | undefined,
    @Args('before') before: string | undefined,
    @Context() ctx: any,
  ) {
    return this.getThreadMessagePageUseCase.execute({
      viewerId: ctx.user.sub,
      threadFbid,
      first,
      before,
    });
  }

  @Mutation('xig_direct_item_seen_mutation_with_slide_messaging_response')
  async markSeen(
    @Args('metadata') metadata: { ig_thread_igid: string },
    @Args('data')
    data: {
      message_id: string;
      message_timestamp_ms: string;
      item_id?: string;
    },
    @Context() ctx: any,
  ) {
    const viewerId: string = ctx.user.sub;

    const result = await this.markSeenUseCase.execute({
      threadFbid: metadata.ig_thread_igid,
      messageId: data.message_id,
      messageTimestampMs: data.message_timestamp_ms,
      viewerId,
    });

    return {
      participant_fbid: result.participant_fbid,
      watermark_timestamp_ms: result.watermark_timestamp_ms,
      watermark_message_id: result.watermark_message_id,
      thread_unread: result.thread_unread,
      unread_thread_count: result.unread_thread_count,
      unread_state_seq: result.unread_state_seq,
    };
  }
}
