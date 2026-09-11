import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { PresenceService } from '@/shared/redis-cluster/presence/presence.service';

@Resolver('Query')
export class PresenceResolver {
  constructor(private readonly presenceService: PresenceService) {}

  /**
   * Returns real-time presence for a single user.
   * Called by the frontend when:
   *  - A conversation is opened.
   *  - The socket reconnects.
   */
  @Query('getPresence')
  async getPresence(
    @Args('userId') userId: string,
    // ctx is available if we need to check auth in the future
    @Context() _ctx: any,
  ) {
    return this.presenceService.getPresence(userId);
  }

  /**
   * Batch presence query. Uses cluster-aware pipelining internally —
   * safe across Redis Cluster nodes.
   */
  @Query('getMultiplePresences')
  async getMultiplePresences(
    @Args('userIds') userIds: string[],
    @Context() _ctx: any,
  ) {
    return this.presenceService.getMultiplePresences(userIds);
  }
}
