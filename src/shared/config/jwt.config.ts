import { registerAs } from '@nestjs/config';
import { JwtConfig } from 'src/types/token/token.types';
import { SignOptions } from 'jsonwebtoken';
import { getEnv } from 'src/helper/getEnv';

export const jwtConfig = registerAs(
  'jwt',
  (): JwtConfig => ({
    accessTokenSecret: getEnv('ACCESS_TOKEN_SECRET'),
    accessTokenExpiresIn: getEnv(
      'ACCESS_TOKEN_EXPIRES_IN',
    ) as SignOptions['expiresIn'],

    refreshTokenSecret: getEnv('REFRESH_TOKEN_SECRET'),
    refreshTokenExpiresIn: getEnv(
      'REFRESH_TOKEN_EXPIRES_IN',
    ) as SignOptions['expiresIn'],

    sessionTokenExpiresIn: getEnv('SESSION_TOKEN_EXPIRES_IN'),

    issuer: getEnv('TOKEN_ISSUER'),
    audience: getEnv('TOKEN_AUDIENCE'),
  }),
);
