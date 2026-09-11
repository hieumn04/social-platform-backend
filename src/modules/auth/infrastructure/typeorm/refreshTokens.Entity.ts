import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

import { UserEntity } from 'src/modules/users/infrastructure/typeorm/user.entity';
import { UserAgentResult } from 'src/types/express';

@Index('idx_refresh_tokens_user_id', ['userId'])
@Index('idx_refresh_tokens_jti', ['jti'], { unique: true })
@Index('idx_refresh_tokens_user_ip_device', ['userId', 'ipAddress', 'deviceId'])
@Entity({ name: 'refresh_tokens' })
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'refresh_token', type: 'varchar', length: 512 })
  refreshToken!: string;

  @Column({ name: 'jti', type: 'varchar', length: 255 })
  jti!: string;

  @Column({ name: 'expired_at', type: 'timestamp' })
  expiredAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'ip_address', type: 'varchar', length: 100, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'device_id', type: 'varchar', length: 255, nullable: true })
  deviceId!: string | null;

  @Column({ name: 'fingerprint', type: 'varchar', length: 255, nullable: true })
  fingerprint?: string | null;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  isRevoked!: boolean;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ name: 'rotated_at', type: 'timestamp', nullable: true })
  rotatedAt?: Date | null;

  @Column({ name: 'user_agent', type: 'json', nullable: true })
  userAgent!: UserAgentResult | null;
}
