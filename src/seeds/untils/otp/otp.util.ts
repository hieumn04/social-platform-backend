import { randomInt } from 'crypto';

export function generateOtp(length: number = 6): string {
  const max = Math.pow(10, length);
  const otp = randomInt(0, max).toString();
  return otp.padStart(length, '0');
}
