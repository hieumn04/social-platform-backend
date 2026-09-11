import { Field, ObjectType } from '@nestjs/graphql';
import { SlideMessageEdgeDto } from '@/modules/mailbox/presentation/graphql/dto/slide-message-edge.dto';
import { PageInfoDto } from '@/modules/mailbox/presentation/graphql/dto/page-info.dto';

@ObjectType('SlideMessageConnection')
export class SlideMessageConnectionDto {
  @Field(() => [SlideMessageEdgeDto])
  edges!: SlideMessageEdgeDto[];

  @Field(() => PageInfoDto, { name: 'page_info' })
  pageInfo!: PageInfoDto;
}
