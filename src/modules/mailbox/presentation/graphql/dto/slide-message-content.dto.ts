import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('SlideMessageXMAContent')
export class SlideMessageXmaContentDto {
  @Field({ name: '__typename' })
  typename!: string;
}

@ObjectType('SlideMessageText')
export class SlideMessageTextContentDto {
  @Field({ name: '__typename' })
  typename!: string;

  @Field({ name: 'text_body', nullable: true })
  textBody?: string;
}
