// import { ConversationParticipantRepository } from '@/modules/coversation/infrastructure/repositories/conversation-participant.repository';
// import { ConversationReadReceiptsRepository } from '@/modules/coversation/infrastructure/repositories/conversation-read-receipts.repository';
// import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
// import { IBlockEdgeRepository } from '@/modules/social-graph/domain/repositories/block-edge.repository';
// import { IRestrictEdgeRepository } from '@/modules/social-graph/domain/repositories/restrict-edge.repository';
// import { UserReadRepository } from '@/modules/users/domain/repositories/user-read.interface.repository';
// import { InboxFolder } from '@/shared/enums/roomStatus.enum';
// import { Inject, Injectable } from '@nestjs/common';

// @Injectable()
// export class LoadSlideMailboxUseCase {
//   constructor(
//     private readonly conversationParticipantRepository: ConversationParticipantRepository,
//     private readonly inboxThreadRepository: TypeormInboxThreadRepository,
//     private readonly readReceiptsRepository: ConversationReadReceiptsRepository,
//     @Inject('UserReadRepository')
//     private readonly userReadRepository: UserReadRepository,

//     @Inject('IBlockEdgeRepository')
//     private readonly blockEdgeRepository: IBlockEdgeRepository,

//     @Inject('IRestrictEdgeRepository')
//     private readonly restrictEdgeRepository: IRestrictEdgeRepository,
//   ) {}

//   async execute(userId: string): Promise<any> {
//     /**
//      * 1️⃣ Load inbox threads
//      */
//     const threads = await this.inboxThreadRepository.getThreadsByFolder(
//       userId,
//       InboxFolder.PRIMARY,
//       20,
//     );

//     if (!threads.length) {
//       return { threads: [] };
//     }

//     /**
//      * 2️⃣ Extract conversationIds
//      */
//     const conversationIds = threads
//       .map((t) => t.conversation_id)
//       .filter(Boolean);

//     if (!conversationIds.length) {
//       return { threads: [] };
//     }

//     /**
//      * parallel query
//      */
//     const [receipts, participants] = await Promise.all([
//       this.readReceiptsRepository.getReadReceipts(conversationIds),
//       this.conversationParticipantRepository.getParticipantsByConversationIds(
//         conversationIds,
//       ),
//     ]);

//     /**
//      * build receipts map
//      */
//     const receiptsByConversation = new Map<string, any[]>();

//     for (const r of receipts) {
//       let list = receiptsByConversation.get(r.conversation_id);

//       if (!list) {
//         list = [];
//         receiptsByConversation.set(r.conversation_id, list);
//       }

//       list.push({
//         participant_fbid: r.participant_id,
//         watermark_timestamp_ms: r.watermark_timestamp,
//       });
//     }
//     /**
//      * build conversationUsers
//      */
//     const conversationUsers = new Map<string, string[]>();

//     for (const p of participants) {
//       if (!conversationUsers.has(p.conversation_id)) {
//         conversationUsers.set(p.conversation_id, []);
//       }

//       conversationUsers.get(p.conversation_id)!.push(p.user_id);
//     }

//     /**
//      * collect targetIds
//      */
//     const allUserIds = new Set<string>();
//     const targetUserIds = new Set<string>();

//     for (const users of conversationUsers.values()) {
//       for (const uid of users) {
//         allUserIds.add(uid);

//         if (uid !== userId) {
//           targetUserIds.add(uid);
//         }
//       }
//     }
//     const userIds = Array.from(allUserIds);
//     const targetIds = Array.from(targetUserIds);

//     /**
//      * parallel block + restrict
//      */
//     const [profiles, blockedTargets, restrictedTargets] = await Promise.all([
//       this.userReadRepository.findProfilesByIds(userIds),
//       this.blockEdgeRepository.findBlockedTargets(userId, targetIds),
//       this.restrictEdgeRepository.findRestrictedTargets(userId, targetIds),
//     ]);

//     const profileMap = new Map<string, any>();

//     for (const profile of profiles) {
//       profileMap.set(profile.id, profile);
//     }

//     /**
//      * 9️⃣ Assemble thread response
//      */
//     const result = [];

//     for (const thread of threads) {
//       const users = conversationUsers.get(thread.conversation_id) ?? [];

//       const userProfiles = users
//         .map((id) => profileMap.get(id))
//         .filter(Boolean);

//       result.push({
//         thread,
//         participants: userProfiles,
//         read_receipts: receiptsByConversation.get(thread.conversation_id) ?? [],
//       });
//     }

//     /**
//      * 8️⃣ Return test result
//      */
//     return {
//       threads: result,
//       blockedTargets: Array.from(blockedTargets),
//       restrictedTargets: Array.from(restrictedTargets),
//     };
//   }
// }
