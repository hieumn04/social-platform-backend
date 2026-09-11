import { Response } from 'express';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  maxAge?: number;
}

export function setCookie(
  res: Response,
  name: string,
  value: string,
  options: CookieOptions = {},
) {
  const isProd = process.env.NODE_ENV === 'production';

  res.clearCookie(name, {
    path: options.path || '/',
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? isProd,
    sameSite: options.sameSite ?? 'lax',
  });

  res.cookie(name, value, {
    ...options,
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? isProd,
    sameSite: options.sameSite ?? 'lax',
  });
}
