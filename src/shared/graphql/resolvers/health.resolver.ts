import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
  @Query(() => String)
  ping() {
    console.log('start ping ...');
    return 'pong';
  }
}
