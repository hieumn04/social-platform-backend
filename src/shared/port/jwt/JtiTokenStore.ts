export interface JtiTokenStore {
  saveJti(jti: string, expiresInSeconds: number): Promise<void>;
  isJtiValid(jti: string): Promise<boolean>;
  revokeJti(jti: string): Promise<void>;
}
