import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { UserEntity } from 'src/modules/users/infrastructure/typeorm/user.entity';
import {
  Method,
  Status,
  StatusRegister,
} from 'src/shared/enums/statusRegister.enum';
import { UserAgentResult } from 'src/types/express';

@Entity('UserVerificationLogs')
export class UserVerificationLogsEntity {
  @PrimaryColumn({ name: 'Id', type: 'uuid' })
  @Generated('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({ name: 'DeviceId', type: 'varchar', length: 255, nullable: true })
  deviceId!: string | null;

  @Column({ name: 'IpAddress', type: 'varchar', length: 100, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'UserAgent', type: 'json', nullable: true })
  userAgent!: UserAgentResult | null;

  @Column({ name: 'Type', type: 'enum', enum: StatusRegister, nullable: false })
  type!: StatusRegister;

  @Column({ name: 'Purpose', type: 'enum', enum: Method, nullable: false })
  purpose!: Method;

  @Column({ name: 'Status', type: 'enum', enum: Status, nullable: false })
  status!: Status;

  @Column({ name: 'Target', length: 36, nullable: false })
  target!: string;

  @Column({ name: 'TokenSentAt', nullable: true, type: 'timestamp' })
  tokenSentAt!: Date | null;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt!: Date;

  @Column({ name: 'VerifiedAt', nullable: true, type: 'timestamp' })
  verifiedAt!: Date | null;

  @Column({ name: 'ExpiresAt', nullable: true, type: 'timestamp' })
  expiresAt!: Date | null;

  @Column({ name: 'AttemptCount', type: 'int', default: 0 })
  attemptCount!: number;
}
