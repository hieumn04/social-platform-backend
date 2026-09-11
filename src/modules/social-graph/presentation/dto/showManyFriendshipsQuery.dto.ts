import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ShowManyFriendshipsDto {
  @IsString()
  @IsNotEmpty()
  /**
   * Instagram gửi dạng:
   * "123,456,789"
   */
  @Matches(/^\d+(,\d+)*$/, {
    message: 'user_ids must be a comma-separated list of numeric IDs',
  })
  user_ids!: string;

  /**
   * jazoest không bắt buộc xử lý,
   * nhưng giữ lại nếu bạn muốn giống Instagram
   */
  @IsString()
  @IsNotEmpty()
  jazoest!: string;
}
