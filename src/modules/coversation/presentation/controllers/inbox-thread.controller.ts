// import { LoadSlideMailboxUseCase } from '@/application/orchestrators/usecases/load-slide-mailbox.orchestrator.ts/load-slide-mailbox.usecase';
// import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
// import { GetSlideThreadNullableUseCase } from '@/modules/coversation/application/use-cases/get-slide-thread-nullable/get-slide-thread-nullable.usecase';
// import { AccessTokenPayload } from '@/types/token/token.types';
// import {
//   BadRequestException,
//   Controller,
//   Get,
//   Param,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
// import { Request } from 'express';

// @Controller('inbox-thread')
// export class InboxThreadController {
//   constructor(
//     private readonly loadSlideMailboxUseCase: LoadSlideMailboxUseCase,
//     private readonly getSlideThreadNullableUseCase: GetSlideThreadNullableUseCase,
//   ) {}

//   @ApiBearerAuth()
//   @Get('inbox')
//   @UseGuards(JwtAuthGuard)
//   async loadInbox(@Req() req: Request) {
//     const user = req.user as AccessTokenPayload;

//     return this.loadSlideMailboxUseCase.execute(user.sub);
//   }

//   @ApiBearerAuth()
//   @UseGuards(JwtAuthGuard)
//   @Get(':threadFbid')
//   @ApiParam({
//     name: 'threadFbid',
//     type: String,
//     example: '1540908213975577',
//   })
//   async getThread(
//     @Param('threadFbid') threadFbid: string,
//     @Req() req: Request,
//   ) {
//     if (!threadFbid) {
//       throw new BadRequestException('threadFbid is required');
//     }

//     const user = req.user as AccessTokenPayload;

//     const result = await this.getSlideThreadNullableUseCase.execute(
//       user.sub,
//       threadFbid,
//     );

//     return {
//       data: {
//         get_slide_thread_nullable: result ?? null,
//       },
//     };
//   }
// }
