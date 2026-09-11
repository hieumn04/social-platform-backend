import { ChatRoomStatus } from '@/shared/enums/roomStatus.enum';

export class EmitToUserInput<T = unknown> {
  constructor(
    public readonly roomId: string,
    public readonly senderId: string,
    public readonly event: string,
    public readonly payload: T,

    public readonly roomStatus: ChatRoomStatus,
    public readonly excludeSocketIds?: string[],
  ) {}
}
