import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveThreadQueryDto {
  @IsString()
  @IsNotEmpty()
  threadKey!: string;
}
