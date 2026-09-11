import { getEnv } from '@/helper/getEnv';
import {
  USER_REGISTER_FIELDS,
  UserRegisterFields,
} from '@/types/typeModel/userProp';

export function flattenObject(
  obj: Record<string, any>,
  prefix = '',
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) continue;
    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (typeof value === 'string' || typeof value === 'number') {
      result[newKey] = value;
    } else {
      result[newKey] = JSON.stringify(value);
    }
  }
  return result;
}

export function flattenSimple(
  obj: Record<string, any>,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenSimple(value));
    } else {
      result[key] =
        typeof value === 'string' || typeof value === 'number'
          ? value
          : JSON.stringify(value);
    }
  }

  return result;
}

function toPrimitive(value: any): string | number | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'object' && typeof value.getValue === 'function') {
    return value.getValue();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'object') {
    return String(value);
  }

  return undefined;
}

export function normalizeUserRegisterFields(
  fields: UserRegisterFields,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  for (const key of USER_REGISTER_FIELDS) {
    const value = fields[key];

    const primitive = toPrimitive(value);
    if (primitive !== undefined) {
      result[key] = primitive;
    }
  }

  return result;
}

export function parseHashResult(
  data: Record<string, string>,
  numberFields: string[] = [],
): Record<string, string | number | null> {
  const result: Record<string, string | number | null> = {};
  for (const [key, value] of Object.entries(data)) {
    if (numberFields.includes(key)) {
      result[key] = value ? Number(value) : null;
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function requirePositiveInt(name: keyof NodeJS.ProcessEnv): number {
  const raw = getEnv(name);
  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }

  return value;
}
