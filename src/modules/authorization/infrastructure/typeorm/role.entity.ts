import { UserEntity } from 'src/modules/users/infrastructure/typeorm/user.entity';
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('roles')
@Index('IDX_ROLE_NAME', ['name'])
@Index('IDX_ROLE_SLUG', ['slug'])
export class RoleEntity {
  @PrimaryColumn({ name: 'role_id', length: 36 })
  id!: string;

  @Column({ name: 'Name', length: 100, unique: true })
  name!: string;

  @Column({ name: 'Slug', length: 100, unique: true })
  slug!: string;

  @Column({ name: 'Description', type: 'text', nullable: true })
  description?: string;

  @Column('simple-array', { name: 'PermissionIds', nullable: true })
  permissions?: string[];

  @Column({ name: 'IsSystemRole', type: 'boolean', default: false })
  isSystemRole!: boolean;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UpdatedAt' })
  updatedAt!: Date;

  @OneToMany(() => UserEntity, (user) => user.role)
  users!: UserEntity[];

  @BeforeUpdate()
  touchUpdatedAt() {
    this.updatedAt = new Date();
  }
}
