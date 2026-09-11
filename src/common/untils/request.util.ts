import { Request } from 'express';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded)) {
    return forwarded[0].trim();
  }

  return req.socket.remoteAddress || '';
}
