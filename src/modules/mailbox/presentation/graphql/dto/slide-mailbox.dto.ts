import { Field, ObjectType } from '@nestjs/graphql';
import { SlideThreadConnectionDto } from '@/modules/mailbox/presentation/graphql/dto/slide-thread-connection.dto';
import { PinnedSlideThreadDto } from '@/modules/mailbox/presentation/graphql/dto/pinned-slide-thread.dto';

@ObjectType('SlideMailbox')
export class SlideMailboxDto {
  @Field({ name: 'iris_inactive_subscription_uq_seq_id' })
  irisInactiveSubscriptionUqSeqId!: string;

  @Field(() => SlideThreadConnectionDto, { name: 'threads_by_folder' })
  threadsByFolder!: SlideThreadConnectionDto;

  @Field(() => [PinnedSlideThreadDto], { name: 'pinned_threads_v2' })
  pinnedThreadsV2!: PinnedSlideThreadDto[];
}
