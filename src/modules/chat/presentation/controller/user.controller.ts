import { Body, Controller, Put } from '@nestjs/common';

import { UpdateUserProfileResponseDto } from '../dto/response/update-user-profile.request.dto';
import { UserProfileMapper } from '../mappers/user-profile.mapper';
import { UpdateUserProfileUseCase } from '../../application/use-cases/update-profile/update-user-profile.usecase';
import { UpdateUserProfileRequestDto } from '../dto/request/update-user-profile.request.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
  ) {}

  @Put('/profile')
  @ApiResponse({
    status: 200,
    description: 'Update user profile successfully',
    type: UpdateUserProfileResponseDto,
  })
  async updateProfile(@Body() req: UpdateUserProfileRequestDto): Promise<null> {
    const input = UserProfileMapper.toInput(req);
    const output = await this.updateUserProfileUseCase.execute(input);

    return null;
  }
}
