import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/JwtAuthAccessGuard';
import { AccessTokenPayload } from '@/types/token/token.types';
import { PushSubscriptionRepository } from '../../infrastructure/repositories/push-subscription.repository';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class CreatePushSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  endpoint!: string;

  @IsNotEmpty()
  @IsObject()
  keys!: {
    p256dh: string;
    auth: string;
  };

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class RevokePushSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  endpoint!: string;
}

@ApiTags('Push Subscriptions')
@Controller('push-subscriptions')
export class PushSubscriptionController {
  constructor(
    private readonly subscriptionRepo: PushSubscriptionRepository,
  ) {}

  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register or update Web Push subscription' })
  async create(
    @Body() dto: CreatePushSubscriptionDto,
    @Req() req: any,
    @Headers('user-agent') userAgentHeader?: string,
  ) {
    const user = req.user as AccessTokenPayload;
    const userId = user.sub;

    const userAgent = dto.userAgent || userAgentHeader || null;

    const subscription = await this.subscriptionRepo.saveOrUpdateSubscription(
      userId,
      dto.endpoint,
      dto.keys.p256dh,
      dto.keys.auth,
      userAgent,
    );

    return {
      success: true,
      message: 'Push subscription saved successfully',
      data: {
        id: subscription.id,
      },
    };
  }

  @ApiBearerAuth()
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke Web Push subscription' })
  async remove(
    @Body() dto: RevokePushSubscriptionDto,
    @Req() req: any,
  ) {
    const user = req.user as AccessTokenPayload;
    const userId = user.sub;

    await this.subscriptionRepo.revokeSubscription(userId, dto.endpoint);

    return {
      success: true,
      message: 'Push subscription revoked successfully',
    };
  }
}
