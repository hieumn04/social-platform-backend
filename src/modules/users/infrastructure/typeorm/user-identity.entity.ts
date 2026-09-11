import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity('user_identities')
@Index('IDX_USER_IDENTITY_FBID_V2', ['fbidV2'], { unique: true })
export class UserIdentityEntity {
  @PrimaryColumn({ name: 'identity_id', type: 'bigint' })
  id!: string;

  @Column({ name: 'fbid_v2', type: 'bigint', unique: true })
  fbidV2!: string;

  @Column({
    name: 'Status',
    type: 'enum',
    enum: ['ACTIVE', 'SUSPENDED', 'DELETED'],
    default: 'ACTIVE',
  })
  status!: 'ACTIVE' | 'SUSPENDED' | 'DELETED';

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt!: Date;
}
