import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('IGViewer')
export class IgViewerDto {
  @Field(() => ID)
  id!: string;

  @Field({ name: 'interop_messaging_user_fbid' })
  interopMessagingUserFbid!: string;

  @Field({ name: 'profile_pic_url' })
  profilePicUrl!: string;
}
