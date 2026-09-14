import type { AuthConfig } from '../types';

export interface EnvironmentConfig {
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  auth?: AuthConfig;
  id?: string;
  specId?: string;
  timeoutMs?: number;
}