export interface IRestrictEdgeRepository {
  findRestrictedTargets(
    restrictorId: string,
    targetIds: string[],
  ): Promise<Set<string>>;
}
