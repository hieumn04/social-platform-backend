import { Module } from '@nestjs/common';
import { NodeFlushPipelineManager } from '@/modules/chat/application/service/node-flush-pipeline-manager';
import { FlushModule } from '@/shared/flush/flush.module';

@Module({
  imports: [FlushModule],
  providers: [NodeFlushPipelineManager],
  exports: [NodeFlushPipelineManager],
})
export class NodeFlushPipelineManagerModule {}
