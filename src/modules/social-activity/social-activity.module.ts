import { SocialActivityPersistenceModule } from '@/modules/social-activity/infrastructure/repositories/social-activity.persistence.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [SocialActivityPersistenceModule],
  // exports: [LoginModule],
  // controllers: [AuthController],
})
export class SocialActivityModule {}
