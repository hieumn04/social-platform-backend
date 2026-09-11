import { Injectable, Inject } from '@nestjs/common';
import { ISocialActivityRepository } from '../../domain/repositories/social-activity.repository';

@Injectable()
export class RecordFollowEventUseCase {
  constructor(
    @Inject('ISocialActivityRepository')
    private readonly repository: ISocialActivityRepository
  ) {}

  async execute(actorId: string, targetUserId: string, eventType: string, metadata: any = {}): Promise<void> {
    await this.repository.recordEvent(actorId, targetUserId, eventType, metadata);
  }
}
