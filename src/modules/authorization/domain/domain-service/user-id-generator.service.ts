export interface UserIdGeneratorService {
  generateNextId(prefix: string): Promise<string>;
}
