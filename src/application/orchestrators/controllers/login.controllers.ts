import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Request, Response } from 'express';
import { RequestContextInfo } from 'src/types/express';
import { LoginUserResponseDto } from '../dtos/response/login-user-response.dto';
import { LoginUserRequestDto } from '../dtos/request/login-user-request.dto';
import { LoginMapper } from '../mappers/LoginMapper';
import { LoginUserUseCases } from '../usecases/loginuserorchestrator/LoginUserUseCases';
import { SessionGuard } from 'src/modules/auth/guards/JwtAuthRefreshGuard';
import { JwtAuthGuard } from 'src/modules/auth/guards/JwtAuthAccessGuard';
import { getTokenFromCookie, getTokenFromHeader } from 'src/helpers/helper';
import { RevokeTokenInput } from 'src/modules/auth/application/use-cases/revoke/revoke-refresh-token.input';
import { RevokeUseCase } from 'src/modules/auth/application/use-cases/revoke/revoke-refresh-token.usecase';
import { RefreshUseCase } from 'src/modules/auth/application/use-cases/refresh/refresh-token.usecase';
import {
  RefreshTokenPayload,
  SignedRefreshToken,
  TokenMetaWithoutKey,
} from 'src/types/token/token.types';
import { RefreshTokenInput } from 'src/modules/auth/application/use-cases/refresh/refresh-token.input';
import { RefreshTokenOutput } from 'src/modules/auth/application/use-cases/refresh/refresh-token.output';
import { CsrfGuard } from 'src/modules/auth/guards/csrf.guard';
import { AuthUser } from 'src/types/typeModel/userProp';
import { Method } from 'src/shared/enums/statusRegister.enum';
import { GenarateTokenPairUseCase } from 'src/modules/auth/application/register/genaratetokenpair.use-case';
import { GenarateTokenPairUserInput } from 'src/modules/auth/application/register/genaratetokenpair-input.usecase';
import { setCookie } from 'src/helpers/cookies';

@ApiTags('auth')
@Controller('auth')
export class LoginController {
  constructor(
    private readonly loginUserUseCases: LoginUserUseCases,
    private readonly revokeUseCase: RevokeUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly genarateTokenPairUseCase: GenarateTokenPairUseCase,
  ) {}

  private buildRequestContext(req: Request): RequestContextInfo {
    return {
      deviceInfo: req?.deviceInfo,
      deviceId: req.deviceId,
      requestId: req.requestId,
      ip: req.ip,
      startTime: req.startTime,
      geo: req.geo,
    };
  }

  private setTokenCookies(res: Response, refreshTokenData: SignedRefreshToken) {
    if (!refreshTokenData) return;

    setCookie(res, 'refreshToken', refreshTokenData.token, {
      httpOnly: true,
      path: '/auth/refresh',
      maxAge: refreshTokenData.expiresIn * 1000,
    });

    setCookie(res, 'sessionId', refreshTokenData.sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: refreshTokenData.expiresInSession * 1000,
    });

    setCookie(res, 'csrfToken', refreshTokenData.csrfToken, {
      httpOnly: false,
      path: '/',
      maxAge: refreshTokenData.expiresInSession * 1000,
    });
  }

  @Post('/login')
  @ApiOperation({
    summary: 'Authenticate user and issue access/refresh/session tokens',
  })
  @ApiResponse({
    status: 200,
    description:
      'User authenticated successfully, tokens are issued and set into cookies',
    type: LoginUserResponseDto,
  })
  async login(
    @Body() body: LoginUserRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginUserResponseDto> {
    const requestContext = this.buildRequestContext(req);
    const input = LoginMapper.toInput(body, requestContext);
    const output = await this.loginUserUseCases.execute(input);

    if (output.success && output.tokens) {
      this.setTokenCookies(res, output.tokens.refreshToken);
    }

    return LoginMapper.toResponse(output);
  }

  @Post('/refresh/logout')
  @ApiOperation({ summary: 'Revoke tokens and clear authentication cookies' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Tokens revoked and session cleared',
    schema: { example: { message: 'Logout successful' } },
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = getTokenFromHeader(req.headers['authorization']);
    const refreshToken = getTokenFromCookie(req.cookies['refreshToken']);
    const sessionId = getTokenFromCookie(req.cookies['sessionId']);

    if (!accessToken || !refreshToken || !sessionId) {
      throw new BadRequestException(
        'Access token , refresh token or sessionId are required for logout.',
      );
    }

    await this.revokeUseCase.execute(
      new RevokeTokenInput(accessToken, refreshToken, sessionId),
    );

    ['refreshToken', 'sessionId', 'csrfToken'].forEach((name) =>
      res.clearCookie(name, {
        path: name === 'refreshToken' ? '/auth/refresh' : '/',
        httpOnly: name !== 'csrfToken',
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      }),
    );

    return { message: 'Logout successful' };
  }

  @Post('/refresh')
  @UseGuards(CsrfGuard, SessionGuard)
  @ApiOperation({
    summary: 'Issue a new access token from session-validated refresh token',
  })
  @ApiResponse({
    status: 200,
    description:
      'A new access token is issued using valid refresh token and session state',
    type: RefreshTokenOutput,
  })
  async refresh(@Req() req: Request): Promise<RefreshTokenOutput> {
    const sessionData = req.session;

    const refreshToken = req.user as RefreshTokenPayload;
    const meta: TokenMetaWithoutKey = {
      requestContext: this.buildRequestContext(req),
    };

    return this.refreshUseCase.execute(
      new RefreshTokenInput(refreshToken, meta, sessionData!),
    );
  }

  @Post('/refresh/renew')
  @UseGuards(CsrfGuard)
  @ApiOperation({
    summary:
      'Renew full token pair from existing valid server-side session (expired refresh flow)',
  })
  @ApiResponse({
    status: 200,
    description:
      'New token pair renewed using server-side session without DB lookup',
    type: LoginUserResponseDto,
  })
  async handleExpiredRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginUserResponseDto> {
    const sessionData = req.session;
    const userInfo: AuthUser = {
      identifier: sessionData!.identifier,
      userId: sessionData!.sub,
      roleId: sessionData!.role,
    };
    const meta: TokenMetaWithoutKey = {
      requestContext: this.buildRequestContext(req),
    };

    const output = await this.genarateTokenPairUseCase.execute(
      new GenarateTokenPairUserInput(userInfo, Method.EXPIREDREFRESH, meta),
    );

    this.setTokenCookies(res, output.tokens!.refreshToken);
    return LoginMapper.toResponse(output);
  }

  @ApiBearerAuth()
  @Get('/access-guard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Test AccessGuard' })
  @ApiResponse({
    status: 200,
    description: 'AccessGuard passed',
    schema: { example: { message: 'Test guard successful' } },
  })
  testAccessGuard() {
    return { message: 'Test guard successful' };
  }
}
