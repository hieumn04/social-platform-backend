// import { GetSlideThreadInput } from '@/application/orchestrators/usecases/get-slide-thread/get-slide-thread.input';
// import { ThreadIdDeriver } from '@/modules/coversation/domain/service/thread-id-deriver';
// import { UserRepository } from '@/modules/users/domain/repositories/user-write.interface.repository';

// export class GetSlideThreadUseCase {
//   constructor(
//     private readonly threadIdDeriver: ThreadIdDeriver,
//     private readonly inboxThreadRepo: InboxThreadRepository,
//     private readonly userRepo: UserRepository,
//   ) {}

//   async execute(input: GetSlideThreadInput): Promise<GetSlideThreadOutput> {
//     const threadId =
//       input.threadId ??
//       this.threadIdDeriver.deriveOneToOne(input.viewerId, input.peerUserId!);

//     // 2. Load inbox thread (viewer-aware)
//     const inboxThread = await this.inboxThreadRepo.findByThreadIdAndViewer(
//       threadId,
//       input.viewerId,
//     );

//     if (!inboxThread) {
//       throw new ThreadNotFoundError();
//     }

//     // 3. Load users
//     const users = await this.userRepo.findUsersInThread(threadId);

//     // 4. Build output
//     return GetSlideThreadOutput.from({
//       inboxThread,
//       users,
//       viewerId: input.viewerId,
//     });
//   }
// }
