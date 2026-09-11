import { NodeId } from "@/modules/value-objects/nodeId";
import { NodeIdProvider } from "@/shared/node/node-id.provider";
import { DefaultNodeIdResolver } from "@/shared/node/node-id.resolver";
import { NODE_ID_RESOLVER } from "@/shared/node/node-id.tokens";
import { Global, Module } from "@nestjs/common";

@Global()
@Module({
  providers: [
    NodeIdProvider,
    {
      provide: NODE_ID_RESOLVER,
      useClass: DefaultNodeIdResolver,
    },
  ],
  exports: [NodeId, NODE_ID_RESOLVER],
})
export class NodeModule {}
