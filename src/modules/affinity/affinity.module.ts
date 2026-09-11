import { AffinityPersistenceModule } from '@/modules/affinity/infrastructure/repositories/follows-score-persistence.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [AffinityPersistenceModule],
})
export class AffinityModule {}
