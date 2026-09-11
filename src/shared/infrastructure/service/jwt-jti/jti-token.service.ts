import { Redis as RedisClient } from 'ioredis';

import { JtiStatus } from '../../../enums/jtiStatus';
import { JtiTokenStore } from 'src/shared/port/jwt/JtiTokenStore';

export class RedisJtiTokenStore implements JtiTokenStore {
  constructor(private readonly redis: RedisClient) {}

  async saveJti(jti: string, expiresInSeconds: number): Promise<void> {
    await this.redis.set(jti, JtiStatus.VALID, 'EX', expiresInSeconds);
  }

  async isJtiValid(jti: string): Promise<boolean> {
    const value = await this.redis.get(jti);
    return value === JtiStatus.VALID;
  }

  async revokeJti(jti: string): Promise<void> {
    await this.redis.set(jti, JtiStatus.REVOKED, 'EX', 3600);
  }
}
