// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { Request } from 'express';
// import { JwtRefreshStrategy } from './jwtRefresh.strategy';
// import { JwtTokenService } from 'src/shared/infrastructure/service/jwt-jti/jwt-token.service';
// import { AppLogger } from 'src/shared/logger/applogger';
// import { JwtRedisService } from 'src/shared/redis/jwt.redis/jwt.redis.service';
// import { RefreshTokenPayload } from 'src/types/token/token.types';
// import { SessionService } from '../domain/domain-service/session.service';
// import { NestConfigService } from 'src/shared/config/config.service';
// import { RedisService } from 'src/shared/redis/redis.service';
// import { CompareResult } from 'src/types/token/refreshToken.props';

// @Injectable()
// export class SessionStrategy extends JwtRefreshStrategy {
//   constructor(
//     configService: NestConfigService,
//     redisService: RedisService,
//     private readonly logger: AppLogger,
//     jwtRedisService: JwtRedisService,
//     private readonly jwtService: JwtTokenService,
//     private readonly sessionService: SessionService,
//   ) {
//     super(configService, redisService, jwtRedisService, logger);
//     this.logger.setContext(SessionStrategy.name);
//   }

//   async validate(
//     payload: RefreshTokenPayload,
//     req: Request,
//   ): Promise<RefreshTokenPayload & CompareResult> {
//     const sessionContext = await super.validate(payload, req);

//     const sessionContextFingerprint =
//       this.sessionService.buildFingerprint(sessionContext.);

//     const currentFingerprint = this.sessionService.buildFingerprint({
//       deviceId: req.deviceId,
//       deviceInfo: req.deviceInfo,
//       ip: req.ip,
//     });

//     const compare = this.sessionService.compareUserAgent(
//       sessionContextFingerprint,
//       currentFingerprint,
//     );

//     if (compare.matchLevel === 'none') {
//       this.logger.warn('Session fingerprint mismatch', {
//         requestId: req.requestId,
//         userId: payload.sub,
//         differences: compare.differences,
//       });
//       throw new UnauthorizedException('Session fingerprint mismatch');
//     }

//     return {
//       ...payload,
//       ...compare,
//     };
//   }
// }
