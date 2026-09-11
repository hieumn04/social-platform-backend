import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AsIgDirectThread {
  @Field()
  id!: string;

  @Field()
  thread_title!: string;
}

@ObjectType()
export class SlideThread {
  @Field()
  id!: string;

  @Field(() => AsIgDirectThread)
  as_ig_direct_thread!: AsIgDirectThread;
}
