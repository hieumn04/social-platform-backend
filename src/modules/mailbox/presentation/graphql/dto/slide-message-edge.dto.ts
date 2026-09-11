import { Field, ObjectType } from '@nestjs/graphql';
import { SlideMessageDto } from '@/modules/mailbox/presentation/graphql/dto/slide-message.dto';

@ObjectType('SlideMessageEdge')
export class SlideMessageEdgeDto {
  @Field()
  cursor!: string;

  @Field(() => SlideMessageDto)
  node!: SlideMessageDto;
}
