export const defaultConfig = {
  port: 3000,
  environment: 'development',
  logLevel: 'info',
  maxBodySize: '1mb',
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 100,
  axiosMaxRetries: 2,
};
