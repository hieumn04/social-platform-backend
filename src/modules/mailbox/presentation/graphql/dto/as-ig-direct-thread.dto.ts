import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IgUserDto } from '@/modules/mailbox/presentation/graphql/dto/ig-user.dto';
import { IgViewerDto } from '@/modules/mailbox/presentation/graphql/dto/ig-viewer.dto';
import { ReadReceiptDto } from '@/modules/mailbox/presentation/graphql/dto/read-receipt.dto';
import { SlideMessageConnectionDto } from '@/modules/mailbox/presentation/graphql/dto/slide-message-connection.dto';

@ObjectType('XFBIGDirectViewerThread')
export class AsIgDirectThreadDto {
  @Field(() => ID, { name: 'thread_fbid', nullable: true })
  threadFbid!: string;

  @Field({ name: 'thread_id', nullable: true })
  threadId!: string;

  @Field({ name: 'thread_key', nullable: true })
  threadKey!: string;

  @Field({ name: 'thread_title', nullable: true })
  threadTitle!: string;

  @Field({ name: 'last_activity_timestamp_ms', nullable: true })
  lastActivityTimestampMs!: string;

  @Field({ name: 'is_pin', nullable: true })
  isPin!: boolean;

  @Field({ name: 'is_group', nullable: true })
  isGroup!: boolean;

  @Field({ name: 'is_muted', nullable: true })
  isMuted!: boolean;

  @Field({ name: 'marked_as_unread', nullable: true })
  markedAsUnread!: boolean;

  @Field({ nullable: true })
  folder!: string;

  @Field({ name: 'system_folder', nullable: true })
  systemFolder!: string;

  @Field(() => [IgUserDto])
  users!: IgUserDto[];

  @Field(() => IgViewerDto, { nullable: true })
  viewer!: IgViewerDto;

  @Field(() => SlideMessageConnectionDto, { name: 'slide_messages' })
  slideMessages!: SlideMessageConnectionDto;

  @Field(() => [ReadReceiptDto], {
    name: 'slide_read_receipts',
    nullable: 'itemsAndList',
  })
  slideReadReceipts!: ReadReceiptDto[];
}
