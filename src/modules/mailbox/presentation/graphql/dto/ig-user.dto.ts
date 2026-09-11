import { Field, ID, ObjectType } from '@nestjs/graphql';
import { FriendshipStatusDto } from '@/modules/mailbox/presentation/graphql/dto/friendship-status.dto';

@ObjectType('IGUser')
export class IgUserDto {
  @Field(() => ID)
  id!: string;

  @Field({ name: 'interop_messaging_user_fbid' })
  interopMessagingUserFbid!: string;

  @Field()
  username!: string;

  @Field({ name: 'full_name' })
  fullName!: string;

  @Field({ name: 'is_verified' })
  isVerified!: boolean;

  @Field({ name: 'profile_pic_url' })
  profilePicUrl!: string;

  @Field(() => FriendshipStatusDto, {
    name: 'friendship_status',
    nullable: true,
  })
  friendshipStatus?: FriendshipStatusDto | null;
}
