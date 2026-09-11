import { Account, IdentifierResult } from 'src/types/typeModel/userProp';
import { Gender } from '../shared/enums/gender.enum';
import crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { roleData } from 'src/seeds/data/roles.data';
import { RoleEnum } from 'src/shared/enums/role.enum';
import { RoleProps } from 'src/types/typeModel/roleProp';
import { Email } from 'src/modules/value-objects/email';
import { PhoneNumber } from 'src/modules/value-objects/phonenumber';

export function isValidGender(value: unknown): value is Gender {
  return Object.values(Gender).includes(value as Gender);
}

export function parseGender(value: unknown): Gender | undefined {
  if (typeof value !== 'string') return undefined;

  const upper = value.toUpperCase();
  return isValidGender(upper) ? upper : undefined;
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function sha256Base64(value: string): string {
  return crypto.createHash('sha256').update(value).digest('base64');
}

export function decodeCursor(cursor: string): string {
  if (!cursor) {
    throw new Error('Cursor is required');
  }

  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');

    if (!decoded) {
      throw new Error('Invalid cursor');
    }

    return decoded;
  } catch (err) {
    throw new Error('Invalid cursor format');
  }
}

export function encodeCursor(value: string): string {
  if (!value) {
    throw new Error('Value is required');
  }

  return Buffer.from(value, 'utf8').toString('base64');
}

export function detectAccountType(accountName: string): keyof Account | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(accountName)) return 'email';

  const phoneRegex = /^(?:\+84|0)\d{9,10}$/;
  if (phoneRegex.test(accountName)) return 'phoneNumber';

  if (accountName.length > 0) return 'nickname';

  return null;
}

export function assertTuple<T extends any[]>(
  arr: unknown[],
  expectedLength: number,
): T {
  if (!arr || arr.length !== expectedLength) {
    throw new UnauthorizedException(
      `Expected array of length ${expectedLength}`,
    );
  }
  return arr as T;
}

export function parseRole(role?: string): RoleEnum {
  if (role && Object.values(RoleEnum).includes(role as RoleEnum)) {
    return role as RoleEnum;
  }
  return RoleEnum.SYSTEM_USER;
}

export function getRoleBySlug(slug: string): RoleProps & { id: string } {
  const found = roleData.find((r) => r.slug === slug);
  if (!found) throw new Error(`Unknown role slug: ${slug}`);
  return found;
}

export function getRoleById(id: string): RoleProps & { id: string } {
  const found = roleData.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown role id: ${id}`);
  return found;
}

export function getTokenFromHeader(header?: string): string | null {
  if (!header) return null;

  return header.replace(/^Bearer\s+/i, '').trim() || null;
}

export function getTokenFromCookie(cookie?: string): string | null {
  if (!cookie) return null;
  return cookie.trim() || null;
}

export function buildIdentifierFromString(
  identifier: string,
): IdentifierResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?\d{7,15}$/;

  if (emailRegex.test(identifier)) {
    return { email: Email.create(identifier), identifierType: 'email' };
  } else if (phoneRegex.test(identifier)) {
    return {
      phoneNumber: PhoneNumber.fromPersistence(identifier),
      identifierType: 'phone',
    };
  } else {
    throw new Error('Invalid identifier format: not email or phone');
  }
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function toBigInt(id: string | number | bigint): bigint {
  if (typeof id === 'bigint') return id;
  if (typeof id === 'number') return BigInt(id);
  if (typeof id === 'string') return BigInt(id);
  throw new Error('Invalid ID type');
}

export function generateThreadHashKey(user1: string, user2: string): string {
  const [u1, u2] = [user1, user2].sort();
  return `DIRECT_${u1}_${u2}`;
}

// export function buildSnippet(text: string): string {
//   const maxLength = 50;
//   let result = '';
//   for (const char of text) {
//     if (stringWidth(result + char) > maxLength) break;
//     result += char;
//   }
//   return result.trim();
// }

export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

export function buildBlock<T extends Record<string, any>>(
  obj: T,
): Partial<T> | undefined {
  const cleaned = cleanObject(obj);
  return Object.keys(cleaned).length ? cleaned : undefined;
}
