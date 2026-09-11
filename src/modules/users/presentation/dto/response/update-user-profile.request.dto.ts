import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../../../../shared/enums/gender.enum';

export class UpdateUserProfileResponseDto {
  @ApiProperty({ example: 'John Doe', description: 'Họ tên sau khi cập nhật' })
  fullName!: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'Địa chỉ sau khi cập nhật',
  })
  address!: string;

  @ApiProperty({
    enum: Gender,
    enumName: 'Gender',
    example: Gender.MALE,
    description: 'Giới tính sau khi cập nhật',
  })
  gender?: Gender;

  @ApiProperty({
    type: String,
    example: '2025-07-03T08:00:00.000Z',
    description: 'Thời điểm cập nhật cuối cùng',
  })
  updatedAt!: Date;
}
