import { ConversationSubtype } from '@/shared/enums/roomStatus.enum';

const EXTRA_GROUP_SUBTYPES = ['CROSS_APP_GROUP'] as const;
type ExtraGroupSubtype = (typeof EXTRA_GROUP_SUBTYPES)[number];

type AllowedSubtype = ConversationSubtype | ExtraGroupSubtype;

export function isGroupConversation(subtype: string): boolean {
  return (
    subtype === ConversationSubtype.GROUP ||
    EXTRA_GROUP_SUBTYPES.includes(subtype as ExtraGroupSubtype)
  );
}
