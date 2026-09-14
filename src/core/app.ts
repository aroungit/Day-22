import express, { type Express } from 'express';
import { createRoutes } from '../api/routes';
import { getConfig, type AppConfig } from './config';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import { rateLimit } from './middlewares/rateLimit';
import { createLogger } from '../infrastructure/logging/Logger';
import { InMemorySpecRepository } from '../infrastructure/persistence/InMemorySpecRepository';
import { InMemoryEnvironmentRepository } from '../infrastructure/persistence/InMemoryEnvironmentRepository';
import { InMemoryRunPlanRepository } from '../infrastructure/persistence/InMemoryRunPlanRepository';
import { InMemoryRunReportRepository } from '../infrastructure/persistence/InMemoryRunReportRepository';

export function createApp(config: AppConfig = getConfig()): Express {
  const app = express();
  const log = createLogger(config.logLevel);
  const specs = new InMemorySpecRepository();
  const environments = new InMemoryEnvironmentRepository();
  const plans = new InMemoryRunPlanRepository();
  const reports = new InMemoryRunReportRepository();

  app.use(express.json({ limit: config.maxBodySize ?? '1mb' }));
  app.use(rateLimit(config.rateLimitWindowMs ?? 60_000, config.rateLimitMaxRequests ?? 100));
  app.use(requestLogger(log));
  app.use(createRoutes(config, specs, environments, plans, reports));
  app.use(errorHandler(log));

  return app;
}
