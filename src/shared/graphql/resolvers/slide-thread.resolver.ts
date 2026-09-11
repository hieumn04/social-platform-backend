// import { GetSlideThreadInput } from '@/application/orchestrators/usecases/get-slide-thread/get-slide-thread.input';
// import { SlideThread } from '@/shared/graphql/slide-thread.model';
// import { Args, Query, Resolver } from '@nestjs/graphql';

// @Resolver(() => SlideThread)
// export class SlideThreadResolver {
//   @Query(() => SlideThread)
//   async get_slide_thread(
//     @Args('input') input: GetSlideThreadInput,
//   ): Promise<SlideThread> {
//     return {
//       id: input.threadId,
//       as_ig_direct_thread: {
//         id: input.threadId,
//         thread_title: 'Demo Thread',
//       },
//     };
//   }
// }
