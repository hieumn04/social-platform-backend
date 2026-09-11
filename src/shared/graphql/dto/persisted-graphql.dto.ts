import { IsObject, IsString } from 'class-validator';

export class PersistedGraphqlDto {
  @IsString()
  doc_id!: string;

  @IsObject()
  variables: Record<string, unknown> = {};
}
