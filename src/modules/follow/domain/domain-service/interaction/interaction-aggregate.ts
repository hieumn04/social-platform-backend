/**
 * Aggregated behavior state between 2 users.
 * This is the BASE of all ranking systems.
 */

export interface InteractionAggregate {
  likeScore: number;
  commentScore: number;
  dmScore: number;
  storyViewScore: number;
  profileViewScore: number;

  /**
   * overall interaction strength
   */
  interactionRank: number;

  /**
   * last activity timestamp
   */
  lastInteractionAt?: Date;
}

/**
 * Factory for safe aggregate initialization
 */
export const createEmptyInteractionAggregate = (): InteractionAggregate => ({
  likeScore: 0,
  commentScore: 0,
  dmScore: 0,
  storyViewScore: 0,
  profileViewScore: 0,
  interactionRank: 0,
  lastInteractionAt: undefined,
});
