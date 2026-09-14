import { createApp } from './app';
import { getConfig } from './config';
import { createLogger } from '../infrastructure/logging/Logger';

const config = getConfig();
const logger = createLogger(config.logLevel);
const app = createApp(config);

app.listen(config.port, () => {
  logger.info('Swagger AI Agent started', {
    port: config.port,
    environment: config.environment,
  });
});
