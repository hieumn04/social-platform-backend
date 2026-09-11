export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export type UsernameValidationCode =
  | 'USERNAME_REQUIRED'
  | 'USERNAME_LENGTH'
  | 'USERNAME_FORMAT';

export interface UsernameValidationError {
  code: UsernameValidationCode;
  message: string;
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(
  value: string,
): UsernameValidationError | null {
  const username = normalizeUsername(value);

  if (!username) {
    return { code: 'USERNAME_REQUIRED', message: 'Username is required.' };
  }

  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return {
      code: 'USERNAME_LENGTH',
      message: `Username must contain between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`,
    };
  }

  if (
    !/^[a-z0-9._]+$/.test(username) ||
    username.startsWith('.') ||
    username.endsWith('.') ||
    username.includes('..')
  ) {
    return {
      code: 'USERNAME_FORMAT',
      message:
        'Username may only contain letters, numbers, periods, and underscores. Periods cannot be consecutive or appear at either end.',
    };
  }

  return null;
}
