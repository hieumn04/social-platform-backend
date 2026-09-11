import { UserFollowStatus } from '@/shared/enums/user-follow-status.enum';
import { UserFollowProps } from '@/types/typeModel/userFollowProps';

export class UserFollow {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    private props: UserFollowProps,
  ) {}

  toObject(): {
    followerId: string;
    followingId: string;
  } & UserFollowProps {
    return {
      followerId: this.followerId,
      followingId: this.followingId,
      ...this.props,
    };
  }

  get status() {
    return this.props.status;
  }

  get isBestie() {
    return this.props.isBestie;
  }

  get isRestricted() {
    return this.props.isRestricted;
  }

  get mutedStory() {
    return this.props.mutedStory;
  }

  get mutedPost() {
    return this.props.mutedPost;
  }

  get interactionRank() {
    return this.props.interactionRank;
  }

  get lastInteractionAt() {
    return this.props.lastInteractionAt;
  }

  public requestFollow(): void {
    if (this.props.status !== UserFollowStatus.PENDING) {
      this.props.status = UserFollowStatus.PENDING;
    }
  }

  public accept(): void {
    if (this.props.status !== UserFollowStatus.PENDING) return;

    this.props.status = UserFollowStatus.ACCEPTED;
    this.props.acceptedAt = new Date();
    this.touchInteraction();
  }

  public remove(): void {
    this.props.status = UserFollowStatus.REMOVED;
    this.props.removedAt = new Date();
  }

  public softBlock(): void {
    this.props.status = UserFollowStatus.BLOCKED_SOFT;
  }

  public markBestie(): void {
    this.props.isBestie = true;
  }

  public unmarkBestie(): void {
    this.props.isBestie = false;
  }

  public restrict(): void {
    this.props.isRestricted = true;
  }

  public unrestrict(): void {
    this.props.isRestricted = false;
  }

  public muteStory(): void {
    this.props.mutedStory = true;
  }

  public unmuteStory(): void {
    this.props.mutedStory = false;
  }

  public mutePost(): void {
    this.props.mutedPost = true;
  }

  public unmutePost(): void {
    this.props.mutedPost = false;
  }

  // ===== Interaction tracking =====

  public touchInteraction(date: Date = new Date()): void {
    this.props.lastInteractionAt = date;
    this.props.interactionRank += 1;
  }

  public static createNew(followerId: string, followingId: string): UserFollow {
    const now = new Date();

    const props: UserFollowProps = {
      status: UserFollowStatus.PENDING,

      isBestie: false,
      isFeedFavorite: false,
      isRestricted: false,

      notifyStory: false,
      notifyPost: false,
      notifyLive: false,

      mutedStory: false,
      mutedPost: false,

      interactionRank: 0,
      lastInteractionAt: null,

      createdAt: now,
      acceptedAt: null,
      removedAt: null,
    };

    return new UserFollow(followerId, followingId, props);
  }

  public static createAccepted(
    followerId: string,
    followingId: string,
  ): UserFollow {
    const follow = UserFollow.createNew(followerId, followingId);
    follow.accept();
    return follow;
  }
}
