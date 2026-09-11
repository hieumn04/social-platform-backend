import { RefreshToken } from '../models/refreshToken';
import { EntityManager } from 'typeorm';

export interface RefreshTokenRepository {
  insert(token: RefreshToken, manager?: EntityManager): Promise<void>;

  findByJti(jti: string): Promise<RefreshToken | null>;

  findActiveByUserId(userId: string): Promise<RefreshToken[]>;

  findByUserIpDevice(
    userId: string,
    deviceId: string | null,
    ipAddress: string | null,
  ): Promise<RefreshToken | null>;

  markRevoked(jti: string, manager?: EntityManager): Promise<void>;

  rotate(
    oldToken: RefreshToken,
    newToken: RefreshToken,
    manager?: EntityManager,
  ): Promise<void>;

  deleteByJti(jti: string, manager?: EntityManager): Promise<void>;
}
