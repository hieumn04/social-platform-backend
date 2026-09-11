import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('SlideThread')
export class PinnedSlideThreadDto {
  @Field(() => ID)
  id!: string;

  @Field({ name: 'thread_title' })
  threadTitle!: string;

  @Field({ name: 'is_pin' })
  isPin!: boolean;
}
