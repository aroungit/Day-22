import winston from 'winston';

export function createLogger(level = 'info'): winston.Logger {
  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
  });
}

export const logger = createLogger();
