// import { ConnectionRepository } from '@/modules/chat/domain/repositories/connection.repository';
// import { AppLogger } from '@/shared/logger/applogger';
// import { Inject, Injectable } from '@nestjs/common';

// @Injectable()
// export class ClusterManagementUseCase {
//   constructor(
//     @Inject('ConnectionRepository')
//     private readonly repo: ConnectionRepository,
//     private readonly logger: AppLogger,
//   ) {
//     this.logger.setContext(ClusterManagementUseCase.name);
//   }

//   async execute(): Promise<void> {
//     try {
//       const nodes = await this.repo.getAllNodeIds();
//       this.logger.log(`All nodes: ${nodes.join(', ')}`);

//       if (!nodes.length) {
//         this.logger.log('No nodes found, skipping cluster management.');
//         return;
//       }

//       const checkPromises = nodes.map(async (nodeId) => {
//         const alive = await this.repo.checkNodeStatus(nodeId);
//         return { nodeId, alive };
//       });

//       const results = await Promise.all(checkPromises);

//       for (const { nodeId, alive } of results) {
//         if (!alive) {
//           this.logger.warn(`Node ${nodeId} dead, cleaning up sockets...`);
//           await this.repo.cleanupNode(nodeId);
//         }
//       }
//     } catch (err) {
//       this.logger.error('Error in ClusterManagementUseCase', { error: err });
//       throw err;
//     }
//   }
// }
