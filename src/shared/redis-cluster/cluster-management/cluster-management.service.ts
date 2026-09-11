// import { ClusterManagementUseCase } from '@/modules/chat/application/usecase/get-all-node/getallnode.usecase';
// import { AppLogger } from '@/shared/logger/applogger';
// import { Injectable } from '@nestjs/common';
// import { Cron } from '@nestjs/schedule';

// @Injectable()
// export class ClusterManagementService {
//   constructor(
//     private readonly clusterUC: ClusterManagementUseCase,
//     private readonly logger: AppLogger,
//   ) {
//     this.logger.setContext(ClusterManagementService.name);
//   }

//   @Cron('*/40 * * * * *')
//   async handleClusterManagement() {
//     try {
//       const result = await this.clusterUC.execute();
//       this.logger.log('Cluster management executed', { result });
//     } catch (err) {
//       this.logger.error('Cluster management failed', { error: err });
//     }
//   }
// }
