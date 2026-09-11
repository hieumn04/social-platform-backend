import { HealthResolver } from '@/shared/graphql/resolvers/health.resolver';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Request } from 'express';
import depthLimit from 'graphql-depth-limit';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,

      typePaths: ['src/**/*.graphql'],

      path: '/internal-graphql',

      playground: false,
      introspection: false,

      validationRules: [depthLimit(5)],

      context: ({ req }: { req: Request }) => ({
        req,
        user: req.user,
      }),
    }),
  ],
  providers: [HealthResolver],
  exports: [GraphQLModule],
})
export class GraphqlInfrastructureModule {}
