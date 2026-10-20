import {
  IRecipientSearchRepository,
  RECIPIENT_SEARCH_REPOSITORY,
} from '@/modules/recipient-search/domain/repositories/recipient-search.repository';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

export interface SearchRecipientsResult {
  query: string;
  ranked_recipients: Array<{
    id: string;
    username: string;
    full_name: string;
    profile_pic_url: string | null;
    is_verified: boolean;
    has_existing_thread: boolean;
    thread_fbid: string | null;
  }>;
}

@Injectable()
export class SearchRecipientsUseCase {
  constructor(
    @Inject(RECIPIENT_SEARCH_REPOSITORY)
    private readonly repository: IRecipientSearchRepository,
  ) {}

  async execute(
    viewerId: string,
    query: string,
    limit = 10,
  ): Promise<SearchRecipientsResult> {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (normalizedQuery.length < 1 || normalizedQuery.length > 50) {
      throw new BadRequestException(
        'query must contain between 1 and 50 characters',
      );
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      throw new BadRequestException(
        'limit must be an integer between 1 and 10',
      );
    }

    const recipients = await this.repository.search(
      viewerId,
      normalizedQuery,
      limit,
    );

    return {
      query: normalizedQuery,
      ranked_recipients: recipients.map((recipient) => ({
        id: recipient.id,
        username: recipient.username,
        full_name: recipient.fullName,
        profile_pic_url: recipient.profilePicUrl,
        is_verified: recipient.isVerified,
        has_existing_thread: Boolean(recipient.threadFbid),
        thread_fbid: recipient.threadFbid,
      })),
    };
  }
}
