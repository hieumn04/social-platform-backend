import { Injectable, Inject } from '@nestjs/common';
import { TypeormInboxThreadRepository } from '@/modules/coversation/infrastructure/repositories/inbox-thread.repository';
import { IBlockEdgeRepository } from '@/modules/social-graph/domain/repositories/block-edge.repository';
import { IRestrictEdgeRepository } from '@/modules/social-graph/domain/repositories/restrict-edge.repository';
import { UserReadRepository } from '@/modules/users/domain/repositories/user-read.interface.repository';
import { AppLogger } from '@/shared/logger/applogger';

type GetSlideThreadNullableResult = {
  id: string;
  as_ig_direct_thread: any;
} | null;

@Injectable()
export class GetSlideThreadNullableUseCase {
  constructor(
    private readonly logger: AppLogger,
    private readonly inboxThreadRepository: TypeormInboxThreadRepository,

    @Inject('UserReadRepository')
    private readonly userReadRepository: UserReadRepository,

    @Inject('IBlockEdgeRepository')
    private readonly blockEdgeRepository: IBlockEdgeRepository,

    @Inject('IRestrictEdgeRepository')
    private readonly restrictEdgeRepository: IRestrictEdgeRepository,
  ) {
    logger.setContext(GetSlideThreadNullableUseCase.name);
  }

  async execute(
    viewerId: string,
    threadFbid: string,
  ): Promise<GetSlideThreadNullableResult> {
    try {
      if (!viewerId || !threadFbid) {
        this.logger.warn('Invalid input', { viewerId, threadFbid });
        return null;
      }

      // Load thread
      const thread = await this.inboxThreadRepository.findByViewerAndThreadFbId(
        viewerId,
        threadFbid,
      );

      if (!thread) {
        this.logger.warn('Thread not found', { viewerId, threadFbid });
        return null;
      }

      const targetUserId = thread.thread_key;
      if (!targetUserId) {
        this.logger.error('Invalid thread_key', { thread });
        return null;
      }

      // Fetch real data
      const [
        targetProfileRaw,
        viewerProfileRaw,
        blockedTargetsRaw,
        restrictedTargetsRaw,
      ] = await Promise.all([
        this.userReadRepository.findProfileById(targetUserId),
        this.userReadRepository.findProfileById(viewerId),
        this.blockEdgeRepository.findBlockedTargets(viewerId, [targetUserId]),
        this.restrictEdgeRepository.findRestrictedTargets(viewerId, [
          targetUserId,
        ]),
      ]);

      // Fallback data
      const targetProfile = targetProfileRaw ?? {
        user_id: targetUserId,
        username: `user_${targetUserId.slice(0, 6)}`,
        full_name: 'Nguyễn Văn A',
        avatar_url: `https://i.pravatar.cc/150?u=${targetUserId}`,
        fbid_v2: `fbid_${targetUserId}`,
        is_verified: false,
      };

      const viewerProfile = viewerProfileRaw ?? {
        user_id: viewerId,
        username: `viewer_${viewerId.slice(0, 6)}`,
        full_name: 'Bạn',
        avatar_url: `https://i.pravatar.cc/150?u=${viewerId}`,
        fbid_v2: `fbid_${viewerId}`,
        is_verified: false,
      };

      const blockedTargets = blockedTargetsRaw ?? new Set<string>();
      const restrictedTargets = restrictedTargetsRaw ?? new Set<string>();

      const isBlocked = blockedTargets.has(targetUserId);
      const isRestricted = restrictedTargets.has(targetUserId);

      // Map users
      const users = [
        {
          id: targetProfile.fbid_v2,
          username: targetProfile.username,
          full_name: targetProfile.full_name,
          profile_pic_url: targetProfile.avatar_url,
          is_verified: targetProfile.is_verified,
          friendship_status: {
            is_restricted: isRestricted,
            blocking: isBlocked,
          },
        },
      ];

      // Map viewer
      const viewer = {
        id: viewerProfile.fbid_v2,
        profile_pic_url: viewerProfile.avatar_url,
      };

      // Build response khớp với GetSlideThreadQuery
      const response: GetSlideThreadNullableResult = {
        id: thread.thread_fbid,
        as_ig_direct_thread: {
          thread_fbid: thread.thread_fbid,
          thread_title: targetProfile.full_name,
          thread_subtype: thread.thread_subtype,
          thread_image_url: targetProfile.avatar_url,
          messaging_folder_tag: thread.reachability_status,
          reachability_status: thread.reachability_status,
          viewer_id: viewerId,
          is_group: false,
          thread_key: thread.thread_key,
          users,
          viewer,
        },
      };

      return response;
    } catch (error) {
      this.logger.error('GetSlideThreadNullableUseCase failed', {
        viewerId,
        threadFbid,
        error,
      });
      throw error;
    }
  }
}
