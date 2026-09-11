import { SocketInfo } from '@/types/socket/gateway';

export class ResolveUserSocketsOutput {
  constructor(public readonly map: Record<string, SocketInfo[]> = {}) {}
}
