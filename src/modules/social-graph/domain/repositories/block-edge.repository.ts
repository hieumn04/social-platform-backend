export interface IBlockEdgeRepository {
  findBlockedTargets(
    blockerId: string,
    targetIds: string[],
  ): Promise<Set<string>>;
}
