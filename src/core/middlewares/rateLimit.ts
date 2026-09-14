import type { RequestHandler } from 'express';

export function rateLimit(windowMs: number, maxRequests: number): RequestHandler {
  const clients = new Map<string, { startedAt: number; count: number }>();
  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const current = clients.get(key);
    if (!current || now - current.startedAt >= windowMs) {
      clients.set(key, { startedAt: now, count: 1 });
      return next();
    }
    current.count += 1;
    if (current.count > maxRequests) {
      response.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }
    return next();
  };
}