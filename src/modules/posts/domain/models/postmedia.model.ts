import crypto from 'crypto';
import { PostMediaProps } from 'src/types/typeModel/posts';

export class PostMedia {
  private readonly _id: string;
  private props: PostMediaProps;

  constructor(props: PostMediaProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }
  get postId(): string {
    return this.props.postId;
  }
  get type(): string {
    return this.props.type;
  }
  get url(): string {
    return this.props.url;
  }
  get position(): number {
    return this.props.position;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  updateUrl(newUrl: string) {
    this.props.url = newUrl;
  }

  updatePosition(newPosition: number) {
    this.props.position = newPosition;
  }

  toObject(): PostMediaProps & { id: string } {
    return { ...this.props, id: this._id };
  }

  public static createNew(
    params: Omit<PostMediaProps, 'createdAt'>,
    id?: string,
  ): PostMedia {
    const fullProps: PostMediaProps = {
      ...params,
      createdAt: new Date(),
    };
    return new PostMedia(fullProps, id);
  }
}
