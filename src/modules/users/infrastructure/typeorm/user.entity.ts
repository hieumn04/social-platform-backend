import { RefreshTokenEntity } from '@/modules/auth/infrastructure/typeorm/refreshTokens.Entity';
import { UserVerificationLogsEntity } from '@/modules/auth/infrastructure/typeorm/userVerificationLogs.entity';
import { RoleEntity } from '@/modules/authorization/infrastructure/typeorm/role.entity';
import { ConversationParticipantEntity } from '@/modules/coversation/infrastructure/typeorm/conversation-participant.entity';
import { InboxThreadEntity } from '@/modules/coversation/infrastructure/typeorm/inbox-thread.entity';
import { MessageEntity } from '@/modules/message/infrastructure/typeorm/message.entity';
import { MessagingActorEntity } from '@/modules/message/infrastructure/typeorm/messagingIdentity.entity';
import { PostEntity } from '@/modules/posts/infrastructure/typeorm/posts.entity';
import { UserIdentityEntity } from '@/modules/users/infrastructure/typeorm/user-identity.entity';
import { Gender } from '@/shared/enums/gender.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Index('idx_users_role_id', ['roleId'])
export class UserEntity {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  id!: string;

  @OneToOne(() => UserIdentityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'identity_id' })
  identity!: UserIdentityEntity;

  @Column({ name: 'identity_id', type: 'bigint', unique: true })
  identityId!: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'username', length: 30, unique: true })
  username!: string;

  @Column({ name: 'full_name', length: 100 })
  fullName!: string;

  @Column({ name: 'bio', length: 255, nullable: true })
  bio?: string;

  @Column({
    name: 'gender',
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender!: Gender;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl?: string;

  @Column({
    name: 'profile_pic_id',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Media ID of avatar in storage system (S3/Cloudinary/CDN)',
  })
  profilePicId?: string;

  @Column({
    name: 'has_anonymous_profile_picture',
    type: 'boolean',
    default: true,
  })
  hasAnonymousProfilePicture!: boolean;

  @Column({ name: 'email', length: 100, unique: true, nullable: true })
  email?: string;

  @Column({
    name: 'phone_number',
    length: 15,
    unique: true,
    nullable: true,
  })
  phoneNumber!: string;

  @Column({
    name: 'account_country',
    type: 'char',
    length: 2,
    nullable: false,
    comment: 'ISO-3166 country code derived from signup IP',
  })
  accountCountry!: string;

  @Column({ name: 'is_private', type: 'boolean', default: false })
  isPrivate!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;

  @Column({ name: 'role_id', length: 36 })
  roleId!: string;

  // @OneToMany(() => UserVerificationLogsEntity, (logs) => logs.user)
  // verificationLogs!: UserVerificationLogsEntity[];

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshTokenEntity[];

  @OneToMany(() => InboxThreadEntity, (thread) => thread.viewer)
  inboxThreads!: InboxThreadEntity[];

  @OneToMany(() => PostEntity, (post) => post.user)
  posts!: PostEntity[];

  @OneToMany(() => ConversationParticipantEntity, (member) => member.user)
  conversationParticipants!: ConversationParticipantEntity[];

  @OneToMany(() => MessageEntity, (message) => message.sender)
  messages!: MessageEntity[];

  @OneToMany(() => MessagingActorEntity, (actor) => actor.user)
  messagingActors!: MessagingActorEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
