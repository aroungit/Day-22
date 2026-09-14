import dotenv from 'dotenv';

export function loadEnvironment(): void {
  dotenv.config({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });
  dotenv.config();
}
