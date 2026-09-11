import { InteractionEdge } from '../models/interaction-edge';

export interface IInteractionEdgeRepository {
  getEdge(actorId: string, targetId: string, interactionType: string): Promise<InteractionEdge | null>;
  upsertEdge(actorId: string, targetId: string, interactionType: string, weightInfo: number): Promise<void>;
}
