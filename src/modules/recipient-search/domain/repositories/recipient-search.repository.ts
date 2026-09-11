import { RecipientSearchResult } from '@/modules/recipient-search/domain/models/recipient-search-result';

export const RECIPIENT_SEARCH_REPOSITORY = 'IRecipientSearchRepository';

export interface IRecipientSearchRepository {
  search(
    viewerId: string,
    normalizedQuery: string,
    limit: number,
  ): Promise<RecipientSearchResult[]>;
}
