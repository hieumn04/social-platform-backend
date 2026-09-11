import { Field, ObjectType } from '@nestjs/graphql';
import { SlideThreadDto } from '@/modules/mailbox/presentation/graphql/dto/slide-thread.dto';

@ObjectType('SlideThreadEdge')
export class SlideThreadEdgeDto {
  @Field()
  cursor!: string;

  @Field(() => SlideThreadDto)
  node!: SlideThreadDto;
}
