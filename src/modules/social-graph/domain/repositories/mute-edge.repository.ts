import { MuteEdge } from '../models/mute-edge';

export interface IMuteEdgeRepository {
  getEdge(muterId: string, mutedId: string): Promise<MuteEdge | null>;
  createEdge(muterId: string, mutedId: string, options: { mutePosts?: boolean; muteStories?: boolean; muteNotes?: boolean }): Promise<void>;
  deleteEdge(muterId: string, mutedId: string): Promise<void>;
}
