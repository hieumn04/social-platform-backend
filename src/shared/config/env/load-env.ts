import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

export function loadEnv() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const envPath = resolve(process.cwd(), `.env.${NODE_ENV}`);

  if (!existsSync(envPath)) {
    throw new Error(` .env file not found at: ${envPath}`);
  }

  config({ path: envPath });

  console.log(` Loaded env file: ${envPath}`);
}
