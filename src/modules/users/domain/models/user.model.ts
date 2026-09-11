import { CreateUserCommand, UserProps } from 'src/types/typeModel/userProp';
import { parseGender } from 'src/helpers/helper';
import { Gender } from 'src/shared/enums/gender.enum';
import { Password } from 'src/modules/value-objects/password';
import { Email } from 'src/modules/value-objects/email';
import { PhoneNumber } from 'src/modules/value-objects/phonenumber';

export class User {
  constructor(
    public readonly userId: string,
    private props: UserProps,
  ) {}

  // ===== Snapshot =====
  toObject(): { userId: string } & UserProps {
    return { userId: this.userId, ...this.props };
  }

  // ===== Getters =====
  get identityId(): string {
    return this.props.identityId;
  }

  get username(): string {
    return this.props.username;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get passwordHash(): Password {
    return this.props.passwordHash;
  }

  get email(): Email | undefined {
    return this.props.email;
  }

  get phoneNumber(): PhoneNumber | undefined {
    return this.props.phoneNumber;
  }

  get accountCountry(): string {
    return this.props.accountCountry;
  }

  get roleId(): string | undefined {
    return this.props.roleId;
  }

  get gender(): Gender | undefined {
    return this.props.gender;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get profilePicId(): string | undefined {
    return this.props.profilePicId;
  }

  get bio(): string | undefined {
    return this.props.bio;
  }

  get hasAnonymousProfilePicture(): boolean {
    return this.props.hasAnonymousProfilePicture;
  }

  get isPrivate(): boolean {
    return this.props.isPrivate;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get verifiedAt(): Date | null {
    return this.props.verifiedAt;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ===== Domain behaviors =====

  public markAsVerified(): void {
    if (this.props.isVerified) return;

    const now = new Date();
    this.props.isVerified = false;
    this.props.verifiedAt = now;
    this.touchUpdatedAt();
  }

  public deactivate(): void {
    if (!this.props.isActive) return;

    this.props.isActive = false;
    this.touchUpdatedAt();
  }

  public reactivate(): void {
    if (this.props.isActive) return;

    this.props.isActive = true;
    this.touchUpdatedAt();
  }

  public markDeleted(): void {
    if (this.props.isDeleted) return;

    this.props.isDeleted = true;
    this.touchUpdatedAt();
  }

  public setPrivate(isPrivate: boolean): void {
    if (this.props.isPrivate === isPrivate) return;

    this.props.isPrivate = isPrivate;
    this.touchUpdatedAt();
  }

  public updateProfile(params: {
    fullName?: string;
    bio?: string;
    gender?: Gender;
    avatarUrl?: string;
  }): void {
    let updated = false;

    if (
      params.fullName !== undefined &&
      params.fullName !== this.props.fullName
    ) {
      this.props.fullName = params.fullName;
      updated = true;
    }

    if (params.bio !== undefined && params.bio !== this.props.bio) {
      this.props.bio = params.bio;
      updated = true;
    }

    const parsedGender = parseGender(params.gender);
    if (parsedGender !== undefined && parsedGender !== this.props.gender) {
      this.props.gender = parsedGender;
      updated = true;
    }

    if (
      params.avatarUrl !== undefined &&
      params.avatarUrl !== this.props.avatarUrl
    ) {
      this.props.avatarUrl = params.avatarUrl;
      this.props.hasAnonymousProfilePicture = false;
      updated = true;
    }

    if (updated) {
      this.touchUpdatedAt();
    }
  }

  // ===== Internal =====
  private touchUpdatedAt(): void {
    this.props.updatedAt = new Date();
  }

  // ===== Factories =====

  public static createNew(userId: string, params: CreateUserCommand): User {
    const now = new Date();

    const props: UserProps = {
      identityId: params.identityId,
      username: params.username,
      fullName: params.fullName,
      passwordHash: params.passwordHash,
      email: params.email,
      phoneNumber: params.phoneNumber,
      accountCountry: params.accountCountry,

      roleId: '11111111-1111-1111-1111-111111111111',
      gender: parseGender(params.gender),
      avatarUrl: undefined,
      profilePicId: undefined,
      bio: undefined,
      hasAnonymousProfilePicture: true,

      isPrivate: false,
      isVerified: false,
      verifiedAt: null,
      isActive: true,
      isDeleted: false,

      createdAt: now,
      updatedAt: now,
    };

    return new User(userId, props);
  }

  public static createVerified(
    userId: string,
    params: CreateUserCommand,
  ): User {
    const user = User.createNew(userId, params);
    user.markAsVerified();
    return user;
  }
}
