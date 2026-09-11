import { Injectable } from '@nestjs/common';
import { FlushService } from '@/shared/flush/flush.service';
import { FlushBuffer } from '@/shared/flush/flush-buffer';
import { FlushBufferOptions, FlushHandler } from '@/types/flush/flush.type';

@Injectable()
export class NodeFlushPipelineManager<T> {
  private readonly pipelines = new Map<string, FlushBuffer<T>>();
  private chunkCounter = 0;
  constructor(private readonly flushService: FlushService) {}

  getOrCreate(
    nodeId: string,
    handler: FlushHandler<T>,
    options?: FlushBufferOptions,
  ): FlushBuffer<T> {
    let buffer = this.pipelines.get(nodeId);
    if (buffer) return buffer;

    buffer = this.flushService.createBuffer(handler, options);
    this.pipelines.set(nodeId, buffer);
    return buffer;
  }

  getOrCreateByChunk(
    handler: FlushHandler<T>,
    options?: FlushBufferOptions,
  ): FlushBuffer<T> {
    const key = `chunk_${this.chunkCounter++}`;
    const buffer = this.flushService.createBuffer(handler, options);
    this.pipelines.set(key, buffer);
    return buffer;
  }

  size(): number {
    return this.pipelines.size;
  }
}
