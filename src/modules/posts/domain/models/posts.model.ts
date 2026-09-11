import { PostProps } from 'src/types/typeModel/posts';
import crypto from 'crypto';

export class Post {
  private readonly _id: string;
  private props: PostProps;

  constructor(props: PostProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  get userId() {
    return this.props.userId;
  }
  get caption() {
    return this.props.caption;
  }
  get likesCount() {
    return this.props.likesCount;
  }
  get commentsCount() {
    return this.props.commentsCount;
  }
  get isDeleted() {
    return this.props.isDeleted;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  like() {
    this.props.likesCount += 1;
  }
  unlike() {
    if (this.props.likesCount > 0) this.props.likesCount -= 1;
  }
  addComment() {
    this.props.commentsCount += 1;
  }
  softDelete() {
    this.props.isDeleted = true;
  }
  updateCaption(newCaption: string) {
    this.props.caption = newCaption;
    this.props.updatedAt = new Date();
  }

  toObject(): PostProps & { id: string } {
    return { ...this.props, id: this._id };
  }

  public static createNew(
    params: Omit<
      PostProps,
      'likesCount' | 'commentsCount' | 'isDeleted' | 'createdAt' | 'updatedAt'
    >,
    postId?: string,
  ): Post {
    const now = new Date();
    const fullProps: PostProps = {
      ...params,
      likesCount: 0,
      commentsCount: 0,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    return new Post(fullProps, postId);
  }
}
