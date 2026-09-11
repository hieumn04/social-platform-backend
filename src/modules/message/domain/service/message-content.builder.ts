import { MessageSqlRow } from '@/types/typeModel/message-raw';
import { MessageType } from '@/shared/enums/message.enum';

export class MessageContentBuilder {
  static async build(
    row: MessageSqlRow,
    resolveStorageUrl?: (key: string) => Promise<string>,
  ) {
    switch (row.content_type) {
      case 'TEXT':
        return {
          __typename: 'SlideMessageText',
          text_body: row.text_body,
        };

      case 'IMAGE': {
        const payload = this.safeParse(row.payload);
        return {
          __typename: 'SlideMessageImage',
          url: payload?.url,
          width: payload?.width,
          height: payload?.height,
        };
      }

      case MessageType.IMAGES: {
        const payload = this.safeParse(row.payload);
        const attachments = Array.isArray(payload?.attachments)
          ? await Promise.all(
              payload.attachments.map(
                async (attachment: Record<string, any>) => ({
                  attachment_fbid: attachment.attachment_fbid,
                  attachment_type: attachment.attachment_type ?? 2,
                  attachment_cdn_url:
                    attachment.attachment_cdn_url ??
                    (attachment.storage_key && resolveStorageUrl
                      ? await resolveStorageUrl(attachment.storage_key)
                      : attachment.storage_key),
                  preview_cdn_url:
                    attachment.preview_cdn_url ??
                    ((attachment.preview_storage_key ??
                      attachment.storage_key) &&
                    resolveStorageUrl
                      ? await resolveStorageUrl(
                          attachment.preview_storage_key ??
                            attachment.storage_key,
                        )
                      : (attachment.preview_storage_key ??
                        attachment.storage_key)),
                  mime_type: attachment.mime_type,
                  size_bytes:
                    attachment.size_bytes != null
                      ? String(attachment.size_bytes)
                      : null,
                  width: attachment.width,
                  height: attachment.height,
                }),
              ),
            )
          : [];
        return { __typename: 'SlideMessageImageContent', attachments };
      }

      case 'VIDEO': {
        const payload = this.safeParse(row.payload);
        return {
          __typename: 'SlideMessageVideo',
          url: payload?.url,
          duration: payload?.duration,
          thumbnail: payload?.thumbnail,
        };
      }

      case 'STICKER': {
        const payload = this.safeParse(row.payload);
        return {
          __typename: 'SlideMessageSticker',
          sticker_id: payload?.sticker_id,
        };
      }

      default:
        return row.payload
          ? {
              __typename: 'SlideMessageXMAContent',
              payload:
                typeof row.payload === 'string'
                  ? row.payload
                  : JSON.stringify(row.payload),
            }
          : null;
    }
  }

  private static safeParse(payload: any) {
    if (!payload) return null;
    if (typeof payload === 'object') return payload;

    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}
