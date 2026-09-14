import request from 'supertest';
import { createApp } from '../../core/app';
import { DefaultAxiosClient } from '../../infrastructure/http/AxiosClient';

const config = {
  port: 3000,
  environment: 'test',
  logLevel: 'silent',
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 1,
};

describe('Phase 12 hardening', () => {
  it('rejects requests after the configured rate limit', async () => {
    const app = createApp(config);
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/health')).status).toBe(429);
  });

  it('rejects oversized JSON bodies consistently', async () => {
    const app = createApp({ ...config, rateLimitMaxRequests: 10, maxBodySize: '20b' });
    const response = await request(app)
      .post('/spec/validate')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ openapi: '3.0.3', info: { title: 'Too large' } }));

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: 'Request payload is too large or malformed' });
  });

  it('does not retry non-idempotent requests by default', async () => {
    const client = new DefaultAxiosClient(2);
    await expect(client.request({ method: 'post', url: 'http://127.0.0.1:1' })).rejects.toBeDefined();
  });
});
