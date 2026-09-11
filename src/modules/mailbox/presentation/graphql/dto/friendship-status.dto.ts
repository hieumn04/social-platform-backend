import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('FriendshipStatus')
export class FriendshipStatusDto {
  @Field({ name: 'is_restricted' })
  isRestricted!: boolean;

  @Field()
  blocking!: boolean;
}
