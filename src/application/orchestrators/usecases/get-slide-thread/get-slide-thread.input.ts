import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class GetSlideThreadInput {
  @Field()
  @IsString()
  threadId!: string;
}
