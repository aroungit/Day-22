import request from 'supertest';
import { createApp } from '../../core/app';
import type { AppConfig } from '../../core/config';

describe('GET /health', () => {
  it('returns the service health status', async () => {
    const config: AppConfig = {
      port: 3000,
      environment: 'test',
      logLevel: 'silent',
    };

    const response = await request(createApp(config)).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'swagger-ai-agent',
      environment: 'test',
    });
  });
});
