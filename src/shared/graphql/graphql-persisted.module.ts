import { GraphqlExecutorService } from '@/shared/graphql/graphql-executor.service';
import { GraphqlInfrastructureModule } from '@/shared/graphql/graphql-infrastructure.module';
import { PersistedGraphqlController } from '@/shared/graphql/persisted-graphql.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [GraphqlInfrastructureModule],
  controllers: [PersistedGraphqlController],
  providers: [GraphqlExecutorService],
  exports: [GraphqlExecutorService],
})
export class GraphqlPersistedModule {}
