import { Field, ObjectType } from '@nestjs/graphql';
import { SlideThreadEdgeDto } from '@/modules/mailbox/presentation/graphql/dto/slide-thread-edge.dto';
import { PageInfoDto } from '@/modules/mailbox/presentation/graphql\dto\page-info.dto';

@ObjectType('SlideThreadConnection')
export class SlideThreadConnectionDto {
  @Field(() => [SlideThreadEdgeDto])
  edges!: SlideThreadEdgeDto[];

  @Field(() => PageInfoDto, { name: 'page_info' })
  pageInfo!: PageInfoDto;
}
