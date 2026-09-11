import { InstagramFollowerResponse } from '@/modules/follow/application/orchestrators/get-followers-with-scores/get-followers-with-profile.output';
import { RankingRow } from '@/modules/follow/domain/domain-service/ranking/ranking-feature-builder.domain-service';
import { UserProfileQueryRow } from '@/types/typeModel/user-raw.type';

export class InstagramFollowersResponseMapper {
  static toResponse(
    profile: UserProfileQueryRow,
    ranking?: RankingRow,
  ): InstagramFollowerResponse {
    const userId = profile.user_id;

    return {
      strong_id__: userId,
      pk: userId,
      pk_id: userId,
      id: userId,

      username: profile.username ?? '',
      full_name: profile.full_name ?? '',
      profile_pic_url: profile.avatar_url ?? '',
      profile_pic_id: profile.profile_pic_id ?? null,

      is_private: Boolean(profile.is_private),
      is_verified: Boolean(profile.is_verified),
      has_anonymous_profile_picture: Boolean(
        profile.has_anonymous_profile_picture,
      ),

      latest_reel_media: 0,

      account_badges: [],

      fbid_v2: profile.fbid_v2 ?? null,

      third_party_downloads_enabled: 0,

      // Ranking
      is_favorite: ranking?.isFeedFavorite ?? false,
    };
  }
}
