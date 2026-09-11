export type PostProps = {
  userId: string;
  caption?: string;
  likesCount: number;
  commentsCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PostMediaProps = {
  postId: string;
  type: string;
  url: string;
  position: number;
  createdAt: Date;
};
