import { Injectable } from '@nestjs/common';
import { UserIdGeneratorService } from '../../domain/domain-service/user-id-generator.service';
import { UserRepository } from '../../domain/repositories/admin.repository.interface';

@Injectable()
export class SequentialUserIdGeneratorService
  implements UserIdGeneratorService
{
  constructor(private readonly userRepo: UserRepository) {}

  async generateNextId(prefix: string = 'U'): Promise<string> {
    const allowedPrefixes = ['U', 'S', 'A', 'M'];

    if (!allowedPrefixes.includes(prefix)) {
      throw new Error(`Invalid prefix: ${prefix}`);
    }
    const latestUser = await this.userRepo.findLatestByUserId();

    let latestNumber = 0;
    if (latestUser) {
      const match = latestUser.userId.match(new RegExp(`^${prefix}(\\d+)$`));
      if (!match) {
        throw new Error(`Invalid ${prefix} ID format: ${latestUser.userId}`);
      }
      latestNumber = parseInt(match[1], 10);
    }
    const nextNumber = latestNumber + 1;
    return prefix + nextNumber.toString().padStart(5, '0');
  }
}
