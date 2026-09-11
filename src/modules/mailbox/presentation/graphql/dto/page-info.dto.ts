import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('PageInfo')
export class PageInfoDto {
  @Field({ name: 'has_next_page' })
  hasNextPage!: boolean;

  @Field({ name: 'end_cursor', nullable: true })
  endCursor?: string | null;
}
