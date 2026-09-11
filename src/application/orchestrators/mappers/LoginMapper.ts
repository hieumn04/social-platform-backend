import { RequestContextInfo } from 'src/types/express';
import { LoginUserResponseDto } from '../dtos/response/login-user-response.dto';
import { LoginUserOutput } from '../usecases/loginuserorchestrator/LoginUserOutput';
import { LoginUserInput } from 'src/modules/users/application/use-cases/login/login.input';
import { LoginUserRequestDto } from '../dtos/request/login-user-request.dto';

export class LoginMapper {
  static toInput(
    dto: LoginUserRequestDto,
    context: RequestContextInfo,
  ): LoginUserInput {
    return new LoginUserInput(dto.accountname, dto.password, context);
  }

  static toResponse(output: LoginUserOutput): LoginUserResponseDto {
    const res = new LoginUserResponseDto();

    res.message = output.message;
    res.success = output.success;
    res.tokens = output.tokens;

    return res;
  }
}
