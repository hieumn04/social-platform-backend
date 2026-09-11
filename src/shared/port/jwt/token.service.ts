import { Method } from 'src/shared/enums/statusRegister.enum';
import { RedisClients } from 'src/types/redis/redis.types';
import { TokenMeta, TokenPayloadMap } from 'src/types/token/token.types';

export interface TokenService {
  createToken<K extends keyof TokenPayloadMap>(
    payload: Omit<TokenPayloadMap[K], 'jti'>,
    options: {
      purpose: Method;
      key: K;
      type: keyof RedisClients;
      meta: TokenMeta;
    },
  ): Promise<{ token: string; expiresIn: number; jti: string }>;
  generateTokenByKey<K extends keyof TokenPayloadMap>(
    key: K,
    payload: TokenPayloadMap[K],
  ): string;
  // verifyToken(token: string): Promise<TokenPayLoad>;
}
