import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ReadReceipt')
export class ReadReceiptDto {
  @Field({ name: 'participant_fbid' })
  participantFbid!: string;

  @Field({ name: 'watermark_timestamp_ms' })
  watermarkTimestampMs!: string;

  @Field({ name: 'watermark_message_id', nullable: true })
  watermarkMessageId!: string | null;
}
