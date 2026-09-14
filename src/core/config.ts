import { defaultConfig } from '../../config/default';
import developmentConfig from '../../config/development';
import productionConfig from '../../config/production';
import testConfig from '../../config/test';
import { loadEnvironment } from './env';

export interface AppConfig {
  port: number;
  environment: string;
  logLevel: string;
  maxBodySize?: string;
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
  axiosMaxRetries?: number;
}

export function getConfig(): AppConfig {
  loadEnvironment();
  const environmentConfig: Partial<AppConfig> = process.env.NODE_ENV === 'production'
    ? productionConfig
    : process.env.NODE_ENV === 'test'
      ? testConfig
      : developmentConfig;

  return {
    ...defaultConfig,
    ...environmentConfig,
    port: Number(process.env.PORT ?? defaultConfig.port),
    environment: process.env.NODE_ENV ?? defaultConfig.environment,
    logLevel: process.env.LOG_LEVEL ?? environmentConfig.logLevel ?? defaultConfig.logLevel,
    maxBodySize: process.env.MAX_BODY_SIZE ?? defaultConfig.maxBodySize,
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? defaultConfig.rateLimitWindowMs),
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? defaultConfig.rateLimitMaxRequests),
    axiosMaxRetries: Number(process.env.AXIOS_MAX_RETRIES ?? defaultConfig.axiosMaxRetries),
  };
}
