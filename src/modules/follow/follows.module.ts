import { Module } from '@nestjs/common';
import { FollowPersistenceModule } from './infrastructure/repositories/follows-persistence.module';
import { FollowersControllerModule } from '@/modules/follow/presentation/controller/followers.controller.module';


@Module({
  imports: [
    FollowPersistenceModule,

    FollowersControllerModule,
  ],
  // exports: [LoginModule],
  // controllers: [AuthController],
})
export class FollowsModule {}
