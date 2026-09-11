import { Request } from 'express';
import { InsertRefreshTokenInput } from '../../application/use-cases/insert/insert-refresh-token.input';
import { InsertRefreshTokenOutput } from '../../application/use-cases/insert/insert-refresh-token.output';
import { InsertRefreshTokenResponseDto } from '../dto/response/insert-refresh-token.response.dto';
import { InsertRefreshTokenRequestDto } from '../dto/request/insert-refresh-token.request.dto';
import { RequestContextInfo } from 'src/types/express';
import { RefreshTokenProps } from 'src/types/token/refreshToken.props';
import { Method } from 'src/shared/enums/statusRegister.enum';
import { TokenMetaWithoutKey } from 'src/types/token/token.types';
import { UserAgent } from '../../domain/value-objects/user-agent.vo';

export class InsertRefreshTokenMapper {
  static toInput(
    body: InsertRefreshTokenRequestDto,
    req: Request,
  ): InsertRefreshTokenInput {
    const userAgentVO = UserAgent.create({
      browser: req.deviceInfo.browser,
      version: req.deviceInfo.version,
      os: req.deviceInfo.os,
      platform: req.deviceInfo.platform,
      deviceType: req.deviceInfo.deviceType,
      rawUserAgent: req.deviceInfo.rawUserAgent,
    });
    const requestContextInfo: RequestContextInfo = {
      deviceInfo: req.deviceInfo,
      deviceId: req.deviceId,
      requestId: req.requestId,
      ip: req.ip,
      startTime: req.startTime,
      geo: req.geo,
    };

    const refreshTokenProps: Omit<RefreshTokenProps, 'refreshToken' | 'jti'> = {
      createdAt: new Date(),
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: userAgentVO ?? 'unknown',
      userId: '11111111-1111-1111-1111-111111111111',
      deviceId: req.deviceId,
      fingerprint: 'TODO-fingerprint',
      isRevoked: false,
      lastUsedAt: undefined,
      rotatedAt: undefined,
    };

    const meta: TokenMetaWithoutKey = {
      requestContext: requestContextInfo,
    };

    return new InsertRefreshTokenInput(
      refreshTokenProps,
      Method.REGISTER,
      meta,
      body.refreshToken,
      body.jti,
    );
  }

  static toResponse(
    output: InsertRefreshTokenOutput,
  ): InsertRefreshTokenResponseDto {
    return {
      success: output.success,
      message: output.message,
    };
  }
}
