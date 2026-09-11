import { RefreshTokenProps } from 'src/types/token/refreshToken.props';
import { UserAgent } from '../value-objects/user-agent.vo';
import { UserAgentResult } from 'src/types/express';

export class RefreshToken {
  private _refreshToken: string;
  private _jti: string;

  constructor(
    public readonly id: string,
    private props: RefreshTokenProps,
  ) {
    this.validate(props);
    this._refreshToken = props.refreshToken;
    this._jti = props.jti;
  }

  get refreshToken(): string {
    return this._refreshToken;
  }

  get jti(): string {
    return this._jti;
  }

  get expiredAt(): Date {
    return this.props.expiredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastUsedAt(): Date | null {
    return this.props.lastUsedAt ?? null;
  }

  get rotatedAt(): Date | null {
    return this.props.rotatedAt ?? null;
  }

  get userId(): string {
    return this.props.userId;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress ?? null;
  }

  get userAgent(): UserAgent | null {
    return this.props.userAgent ? UserAgent.create(this.props.userAgent) : null;
  }

  get deviceId(): string | undefined {
    return this.props.deviceId;
  }

  get fingerprint(): string | undefined {
    return this.props.fingerprint;
  }

  get isRevoked(): boolean {
    return this.props.isRevoked === true;
  }

  get isExpired(): boolean {
    return this.props.expiredAt.getTime() < Date.now();
  }

  get isActive(): boolean {
    return !this.isExpired && !this.isRevoked;
  }

  isValid(jti: string): boolean {
    return this.jti === jti && this.isActive;
  }

  isCreatedWithin(ms: number): boolean {
    return Date.now() - this.createdAt.getTime() <= ms;
  }

  markAsUsed(): void {
    this.props.lastUsedAt = new Date();
  }

  rotate(
    newToken: string,
    expiresAt: Date,
    newJti: string,
    userAgent: UserAgent,
    ipAddress: string,
    deviceId?: string,
    fingerprint?: string,
  ): void {
    // ===== Validation =====
    if (!(userAgent instanceof UserAgent)) {
      throw new Error('RefreshToken.rotate: userAgent must be a UserAgent VO');
    }
    if (!ipAddress) {
      throw new Error('RefreshToken.rotate: ipAddress is required');
    }

    // ===== Update immutable token fields =====
    this._refreshToken = newToken;
    this._jti = newJti;

    // ===== Update other props =====
    this.props.expiredAt = expiresAt;
    this.props.createdAt = new Date();
    this.props.rotatedAt = new Date();
    this.props.userAgent = userAgent;
    this.props.ipAddress = ipAddress;
    this.props.deviceId = deviceId;
    this.props.fingerprint = fingerprint;
  }

  revoke(): void {
    this.props.isRevoked = true;
  }

  toPersistence(): { id: string } & Omit<RefreshTokenProps, 'userAgent'> & {
      userAgent: UserAgentResult;
    } {
    return {
      id: this.id,
      ...this.props,
      userAgent: this.props.userAgent.toObject(),
    };
  }

  static createNew(
    id: string,
    props: Omit<RefreshTokenProps, 'createdAt'>,
  ): RefreshToken {
    return new RefreshToken(id, {
      ...props,
      createdAt: new Date(),
    });
  }

  private validate(props: RefreshTokenProps): void {
    if (!props.refreshToken)
      throw new Error('RefreshToken: refreshToken is required');
    if (!props.jti) throw new Error('RefreshToken: jti is required');
    if (!props.userId) throw new Error('RefreshToken: userId is required');
    if (!props.expiredAt)
      throw new Error('RefreshToken: expiredAt is required');
    if (!props.ipAddress)
      throw new Error('RefreshToken: ipAddress is required');
    if (!props.deviceId) throw new Error('RefreshToken: deviceId is required');
    if (!(props.userAgent instanceof UserAgent)) {
      throw new Error('RefreshToken: userAgent must be a UserAgent VO');
    }
  }
}
