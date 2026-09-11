import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate,
  Index,
} from 'typeorm';

@Entity('Admins')
@Index('IDX_ADMIN_EMAIL', ['email'])
export class AdminEntity {
  @PrimaryColumn({ name: 'AdminId', length: 36 })
  id!: string;

  @Column({ name: 'Name', length: 100 })
  name!: string;

  @Column({ name: 'Email', length: 100, unique: true })
  email!: string;

  @Column({ name: 'PasswordHash', type: 'varchar' })
  passwordHash!: string | null;

  // @Column({ name: 'Role', type: 'enum', enum: Role, length: 50 })
  // role!: Role;

  @Column({ name: 'IsActive', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UpdatedAt' })
  updatedAt!: Date;

  @BeforeUpdate()
  touchUpdatedAt() {
    this.updatedAt = new Date();
  }
}
