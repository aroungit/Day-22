import type { RequestHandler } from 'express';
import type winston from 'winston';

export function requestLogger(log: winston.Logger): RequestHandler {
  return (request, response, next) => {
    const startedAt = Date.now();
    response.on('finish', () => {
      log.info('HTTP request completed', {
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });
    next();
  };
}
