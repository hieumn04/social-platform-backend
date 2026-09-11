// import {
//   Controller,
//   Post,
//   Body,
//   UseGuards,
//   Req,
//   HttpCode,
//   HttpStatus,
//   Inject,
// } from '@nestjs/common';
// import {
//   ApiBearerAuth,
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
// } from '@nestjs/swagger';
// import { Request } from 'express';

// import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
// import { AccessTokenPayload } from '@/types/token/token.types';
// import { SendFirstMessageDto } from '../dto/send-first-message.dto';
// import { RedisStreamService } from '@/shared/redis/redis-stream.service';
// import { SnowflakeIdGenerator } from '@/shared/snowflake-generator/snowflakeId-generator';
// import { MessageFanout } from '@/modules/message/application/port/message-fanout.port';
// import { generateThreadHashKey } from '@/helpers/helper';

// @ApiTags('Messages - Production Flow')
// @Controller('messages')
// export class MessageController {
//   constructor(
//     private readonly redisStreamService: RedisStreamService,
//     private readonly idGenerator: SnowflakeIdGenerator,
//     @Inject('MessageFanout')
//     private readonly fanoutService: MessageFanout,
//   ) {}

//   @ApiBearerAuth()
//   @UseGuards(JwtAuthGuard)
//   @Post('send-first')
//   @HttpCode(HttpStatus.ACCEPTED)
//   @ApiOperation({ summary: 'Send first message (Fast Path - Instagram style)' })
//   @ApiResponse({ status: 202, description: 'Message accepted for processing' })
//   async sendFirstMessage(
//     @Req() req: Request,
//     @Body() body: SendFirstMessageDto,
//   ) {
//     const user = req.user as AccessTokenPayload;
//     const senderFbid = user.sub;
//     const { recipientFbid, content, clientContext } = body;

//     // 1. Generate real Message ID immediately
//     const messageId = this.idGenerator.nextId();
//     const timestampMs = Date.now();

//     // 2. Identify Target Room (Pre-Fanout)
//     // For first message, we use a deterministic tempThreadKey based on participants
//     const tempThreadKey = generateThreadHashKey(senderFbid, recipientFbid);

//     // 3. STEP 2.5: PRE-FANOUT (Instant UI Update)
//     // We emit "message:temp" so all user devices see the "Sending..." state
//     const tempPayload = {
//       messageId,
//       clientContext,
//       senderId: senderFbid,
//       content,
//       status: 'SENDING',
//       timestamp: timestampMs,
//     };

//     // Non-blocking fanout
//     void this.fanoutService.preFanout(tempThreadKey, tempPayload);

//     // 4. STEP 3: Push to Redis Stream (Reliability Layer)
//     await this.redisStreamService.xadd('chat:messages', {
//       messageId,
//       clientContext,
//       senderId: senderFbid,
//       recipientId: recipientFbid,
//       content,
//       timestamp: timestampMs.toString(),
//       isFirstMessageHint: 'true',
//     });

//     // 5. Response 202 immediately
//     return {
//       message: 'Message accepted',
//       data: {
//         messageId,
//         clientContext,
//         status: 'ACCEPTED',
//       },
//     };
//   }
// }
