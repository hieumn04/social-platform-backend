import { SessionData } from 'src/types/session/Session';
import {
  RefreshTokenPayload,
  TokenMetaWithoutKey,
} from 'src/types/token/token.types';

export class RefreshTokenInput {
  constructor(
    public readonly user: RefreshTokenPayload,
    public readonly meta: TokenMetaWithoutKey,
    public readonly sessionData: SessionData,
  ) {}
}
