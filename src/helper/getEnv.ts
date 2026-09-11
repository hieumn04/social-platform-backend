export function getEnv(key: keyof NodeJS.ProcessEnv): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
}

export function mustGetEnv<T extends keyof NodeJS.ProcessEnv>(key: T): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env: ${key}`);
  }
  return value;
}

export function encodeURIComponent(value: string): string {
  return encodeURIComponent(value.toLowerCase());
}

export function safeDecodeURIComponent(encoded: string): string {
  return decodeURIComponent(encoded);
}
