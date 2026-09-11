import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  SlideMessageTextContentDto,
  SlideMessageXmaContentDto,
} from '@/modules/mailbox/presentation/graphql/dto/slide-message-content.dto';

@ObjectType('SlideMessage')
export class SlideMessageDto {
  @Field(() => ID)
  id!: string;

  @Field({ name: 'sender_fbid' })
  senderFbid!: string;

  @Field({ name: 'timestamp_ms' })
  timestampMs!: string;

  @Field({ name: 'content_type' })
  contentType!: string;

  @Field({ name: 'text_body', nullable: true })
  textBody?: string;

  @Field({ name: 'igd_snippet', nullable: true })
  igdSnippet?: string;

  @Field(() => SlideMessageXmaContentDto, {
    nullable: true,
    name: 'content',
  })
  content?: SlideMessageXmaContentDto | SlideMessageTextContentDto | null;
}
