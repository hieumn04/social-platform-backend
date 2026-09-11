// import {
//   Body,
//   Controller,
//   HttpCode,
//   HttpStatus,
//   Post,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBearerAuth,
// } from '@nestjs/swagger';

// import { SendChatEventOutput } from '@/application/orchestrators/usecases/send-chat-event/send-chat-event.output';

// import { SendMessageRequestDto } from '@/application/orchestrators/dtos/request/send-message-request.dto';
// import { SendMessageMapper } from '@/application/orchestrators/mappers/SendMessageMapper';
// import { CsrfGuard } from '@/modules/auth/guards/csrf.guard';
// import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
// import { Request } from 'express';
// import { AccessTokenPayload } from '@/types/token/token.types';
// import { SendMessageAndEmitEventUseCase } from '@/application/orchestrators/usecases/messageandsendorchestrator/send-message-and-emit-event.usecase';

// @ApiTags('Messages')
// @Controller('messages')
// export class MessageController {
//   constructor(
//     private readonly sendMessageAndEmitEvent: SendMessageAndEmitEventUseCase,
//   ) {}

//   @Post('send')
//   @ApiBearerAuth()
//   @UseGuards(CsrfGuard, JwtAuthGuard)
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Send a message and publish chat event' })
//   @ApiResponse({
//     status: 200,
//     description: 'Message sent and event published successfully',
//     type: SendChatEventOutput,
//   })
//   async sendMessage(
//     @Req() req: Request,
//     @Body() dto: SendMessageRequestDto,
//   ): Promise<SendChatEventOutput> {
//     const user = req.user as AccessTokenPayload;
//     const userId = user.sub;
//     const input = SendMessageMapper.toInput(dto, userId);
//     return this.sendMessageAndEmitEvent.execute(input);
//   }
// }
