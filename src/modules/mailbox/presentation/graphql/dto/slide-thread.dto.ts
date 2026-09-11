import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AsIgDirectThreadDto } from '@/modules/mailbox/presentation/graphql/dto/as-ig-direct-thread.dto';

@ObjectType('SlideThread')
export class SlideThreadDto {
  @Field(() => ID)
  id!: string;

  @Field(() => AsIgDirectThreadDto, { name: 'as_ig_direct_thread' })
  asIgDirectThread!: AsIgDirectThreadDto;
}
