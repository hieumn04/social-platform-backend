import { ChatRoomRole } from '@/shared/enums/role.enum';
import {
  ChatRoomMemberStatus,
  ChatRoomStatus,
} from '@/shared/enums/roomStatus.enum';

export interface ChatRoomProps {
  name?: string;
  avatarUrl?: string;
  createdBy?: string;
  isGroup?: boolean;
  createdAt?: Date;
  status?: ChatRoomStatus;
}

export interface ChatRoomMemberProps {
  chatRoomId: string;
  userId: string;
  role: ChatRoomRole;
  joinedAt: Date;
  leftAt?: Date;
  removedAt?: Date;
  mutedAt?: Date;
  status: ChatRoomMemberStatus;
}

export interface CreateChatRoomMemberOptions {
  roleId?: string;
  canSendMessage?: boolean;
  canAddUser?: boolean;
}

export interface UpdateChatRoomInfoPayload {
  name?: string;
  avatarUrl?: string;
  status?: ChatRoomStatus;
}

export interface RoomJoinPayload {
  roomid: string;
  name?: string;
  avatarUrl?: string;
  createdBy?: string;
  isGroup: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomRealtimePayload {
  roomId: string;
  lastMessageId?: string;
  lastMessageAt?: string;
  roomSeq: number;
}

export interface UserRoomRealtimePayload {
  userId: string;
  roomId: string;
  lastSeenSeq: number;
}

export interface RoomData {
  meta?: Omit<RoomJoinPayload, 'roomid'>;

  realtime?: Omit<RoomRealtimePayload, 'roomId'>;

  usersRealtime?: Omit<UserRoomRealtimePayload, 'roomId'>[];
}

export type AddRoomsParams = Record<string, RoomData>;
