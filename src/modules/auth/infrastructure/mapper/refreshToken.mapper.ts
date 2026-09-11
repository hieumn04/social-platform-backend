import { UUID } from 'crypto';
import { RefreshToken } from '../../domain/models/refreshToken';
import { RefreshTokenEntity } from '../typeorm/refreshTokens.Entity';
import { UserAgent } from '../../domain/value-objects/user-agent.vo';

export class RefreshTokenMapper {
  static toDomain(entity: RefreshTokenEntity): RefreshToken {
    return new RefreshToken(entity.id, {
      refreshToken: entity.refreshToken,
      jti: entity.jti,
      expiredAt: entity.expiredAt,
      createdAt: entity.createdAt,
      lastUsedAt: entity.lastUsedAt ?? undefined,
      rotatedAt: entity.rotatedAt ?? undefined,
      userId: entity.userId,
      ipAddress: entity.ipAddress ?? undefined,
      deviceId: entity.deviceId ?? undefined,
      fingerprint: entity.fingerprint ?? undefined,
      isRevoked: entity.isRevoked ?? false,
      userAgent: UserAgent.create(entity.userAgent),
    });
  }

  static toEntity(domain: RefreshToken): RefreshTokenEntity {
    const entity = new RefreshTokenEntity();

    entity.id = domain.id as UUID;
    entity.refreshToken = domain.refreshToken;
    entity.jti = domain.jti;
    entity.expiredAt = domain.expiredAt;
    entity.createdAt = domain.createdAt;
    entity.lastUsedAt = domain.lastUsedAt;
    entity.rotatedAt = domain.rotatedAt ?? null;
    entity.userId = domain.userId;
    entity.ipAddress = domain.ipAddress;
    entity.deviceId = domain.deviceId ?? null;
    entity.fingerprint = domain.fingerprint ?? null;
    entity.isRevoked = domain.isRevoked;
    entity.userAgent = domain.userAgent ? domain.userAgent.toObject() : null;

    return entity;
  }
}
