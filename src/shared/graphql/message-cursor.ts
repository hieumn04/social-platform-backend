import { BadRequestException } from '@nestjs/common';

export function encodeMessageCursor(messageId: string): string {
  return Buffer.from(messageId, 'utf8').toString('base64url');
}

export function decodeMessageCursor(cursor: string): string {
  let decoded: string;

  try {
    decoded = Buffer.from(cursor, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid message cursor');
  }

  if (!/^\d+$/.test(decoded)) {
    throw new BadRequestException('Invalid message cursor');
  }

  return decoded;
}
