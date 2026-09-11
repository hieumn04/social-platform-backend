import { SearchRecipientsUseCase } from '@/modules/recipient-search/application/usecases/search-recipients.usecase';
import { RECIPIENT_SEARCH_REPOSITORY } from '@/modules/recipient-search/domain/repositories/recipient-search.repository';
import { RecipientSearchRepositoryImpl } from '@/modules/recipient-search/infrastructure/repositories/recipient-search.repository.impl';
import { RecipientSearchController } from '@/modules/recipient-search/presentation/http/recipient-search.controller';
import { AuthGuardsModule } from '@/modules/auth/guards/auth-guards.module';
import { DatabaseModule } from '@/shared/database/database.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, AuthGuardsModule],
  controllers: [RecipientSearchController],
  providers: [
    {
      provide: RECIPIENT_SEARCH_REPOSITORY,
      useClass: RecipientSearchRepositoryImpl,
    },
    SearchRecipientsUseCase,
  ],
})
export class RecipientSearchModule {}
