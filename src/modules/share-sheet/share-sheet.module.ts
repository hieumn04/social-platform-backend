import { GetShareSheetRankingUseCase } from '@/modules/share-sheet/application/usecases/get-share-sheet-ranking.usecase';
import { SHARE_SHEET_RANKING_REPOSITORY } from '@/modules/share-sheet/domain/repositories/share-sheet-ranking.repository';
import { ShareSheetRankingDomainService } from '@/modules/share-sheet/domain/services/share-sheet-ranking.domain-service';
import { ShareSheetRankingRepositoryImpl } from '@/modules/share-sheet/infrastructure/repositories/share-sheet-ranking.repository.impl';
import { ShareSheetResolver } from '@/modules/share-sheet/presentation/graphql/share-sheet.resolver';
import { AuthGuardsModule } from '@/modules/auth/guards/auth-guards.module';
import { DatabaseModule } from '@/shared/database/database.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, AuthGuardsModule],
  providers: [
    {
      provide: SHARE_SHEET_RANKING_REPOSITORY,
      useClass: ShareSheetRankingRepositoryImpl,
    },
    ShareSheetRankingDomainService,
    GetShareSheetRankingUseCase,
    ShareSheetResolver,
  ],
  exports: [GetShareSheetRankingUseCase],
})
export class ShareSheetModule {}
