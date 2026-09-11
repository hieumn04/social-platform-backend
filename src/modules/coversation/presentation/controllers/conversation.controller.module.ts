import { GetSlideThreadNullableModule } from '@/modules/coversation/application/use-cases/get-slide-thread-nullable/get-slide-thread-nullable.module';
import { ResolveThreadModule } from '@/modules/coversation/application/use-cases/routedefinition/resolve-thread.module';

import { InboxThreadRouteController } from '@/modules/coversation/presentation/controllers/route-definition.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [GetSlideThreadNullableModule, ResolveThreadModule],
  controllers: [InboxThreadRouteController],
})
export class ConversationsControllerModule {}
