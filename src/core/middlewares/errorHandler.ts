import type { ErrorRequestHandler } from 'express';
import type winston from 'winston';

export function errorHandler(log: winston.Logger): ErrorRequestHandler {
  return (error, _request, response, _next) => {
    log.error('Unhandled application error', { error });
    if (isPayloadError(error)) {
      response.status(413).json({ error: 'Request payload is too large or malformed' });
      return;
    }
    response.status(500).json({ error: 'Internal Server Error' });
  };
}

function isPayloadError(error: unknown): error is { type: string } {
  return typeof error === 'object' && error !== null && 'type' in error && ['entity.too.large', 'entity.parse.failed'].includes(String((error as { type: unknown }).type));
}
