import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { CreateMessageMediaUploadUseCase } from '@/modules/message/application/use-cases/media/create-message-media-upload.usecase';
import { ResumeMessageMediaUploadUseCase } from '@/modules/message/application/use-cases/media/resume-message-media-upload.usecase';
import { GetMessageSendStatusUseCase } from '@/modules/message/application/use-cases/media/get-message-send-status.usecase';
import { MessageType } from '@/shared/enums/message.enum';

import { SendFirstMessageUseCase } from '@/modules/message/application/use-cases/send-first-message/send-first-message.usecase';
import { SendNormalMessageUseCase } from '@/modules/message/application/use-cases/send-normal-message/send-normal-message.usecase';

import {
  SendSlideMessageWithAttribution,
  SendSlideMessageInput,
} from '@/types/typeModel/message';

import { SendFirstMessageInput } from '@/modules/message/application/use-cases/send-first-message/send-first-message.input';
import { SendMessageInput } from '@/modules/message/application/use-cases/send-normal-message/send-message.input';

@Resolver()
export class MessageResolver {
  constructor(
    private readonly sendFirstMessageUC: SendFirstMessageUseCase,
    private readonly sendNormalMessageUC: SendNormalMessageUseCase,
    private readonly createMediaUploadUC: CreateMessageMediaUploadUseCase,
    private readonly resumeMediaUploadUC: ResumeMessageMediaUploadUseCase,
    private readonly getMessageSendStatusUC: GetMessageSendStatusUseCase,
  ) {}

  @Mutation('create_direct_media_upload')
  async createDirectMediaUpload(
    @Args('input')
    input: {
      thread_fbid: string;
      content_type: string;
      content_length: number;
      width?: number | null;
      height?: number | null;
    },
    @Context() ctx: any,
  ) {
    return this.createMediaUploadUC.execute({
      viewerId: ctx.user.sub,
      threadFbid: input.thread_fbid,
      contentType: input.content_type,
      contentLength: input.content_length,
      width: input.width,
      height: input.height,
    });
  }

  @Mutation('resume_direct_media_upload')
  async resumeDirectMediaUpload(
    @Args('input') input: { thread_fbid: string; upload_id: string },
    @Context() ctx: any,
  ) {
    return this.resumeMediaUploadUC.execute({
      viewerId: ctx.user.sub,
      threadFbid: input.thread_fbid,
      uploadId: input.upload_id,
    });
  }

  @Mutation('get_direct_message_send_status')
  async getDirectMessageSendStatus(
    @Args('thread_fbid') threadFbid: string,
    @Args('offline_threading_id') offlineThreadingId: string,
    @Context() ctx: any,
  ) {
    return this.getMessageSendStatusUC.execute({
      viewerId: ctx.user.sub,
      threadFbid,
      offlineThreadingId,
    });
  }

  @Mutation('send_slide_message')
  async sendSlideMessage(
    @Args('input') input: SendSlideMessageWithAttribution,
    @Context() ctx: any,
  ) {
    const senderId: string = ctx.user.sub;

    const hasThread = !!input.ig_thread_igid;
    const hasRecipients =
      Array.isArray(input.recipient_igids) && input.recipient_igids.length > 0;

    // ==============================
    // VALIDATION (STRICT)
    // ==============================
    if (!hasThread && !hasRecipients) {
      throw new BadRequestException(
        'Must provide ig_thread_igid OR recipient_igids',
      );
    }

    if (hasThread && hasRecipients) {
      throw new BadRequestException(
        'Cannot provide both ig_thread_igid and recipient_igids',
      );
    }

    let result;

    // ==============================
    // CASE 1: CREATE THREAD
    // ==============================
    if (!hasThread) {
      if ((input.content_type ?? MessageType.TEXT) !== MessageType.TEXT) {
        throw new BadRequestException(
          'Create the thread with a text message before sending media or a shared post',
        );
      }
      // 🔥 transform về đúng type (bỏ attribution)
      const { send_attribution, ...pureInput } = input;

      const ucInput = new SendFirstMessageInput(
        senderId,
        pureInput as SendSlideMessageInput,
      );

      result = await this.sendFirstMessageUC.execute(ucInput);
    }

    // ==============================
    // CASE 2: SEND EXISTING THREAD
    // ==============================
    else {
      const ucInput: SendMessageInput = {
        senderId,
        sendSlideMessageWAttribute: input,
      };

      result = await this.sendNormalMessageUC.execute(ucInput);
    }

    // ==============================
    // RESPONSE (KEEP SHAPE)
    // ==============================
    return {
      xig_direct_text_send_with_slide_messaging_response: {
        message_id: result.messageId,
        timestamp_ms: String(result.timestampMs),
        id: result.conversationId,
      },
    };
  }
}
