import request from 'supertest';
import { createApp } from '../../core/app';

const openApi3Document = {
  openapi: '3.0.3',
  info: { title: 'Pet API', version: '1.2.0' },
  servers: [{ url: 'https://api.example.com/v1' }],
  paths: {
    '/pets/{petId}': {
      get: {
        operationId: 'getPet',
        tags: ['pets'],
        parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'A pet', content: { 'application/json': { schema: { type: 'object' } } } } },
      },
    },
  },
};

describe('Phase 4 specification API', () => {
  it('imports and exposes normalized OpenAPI operations and tags', async () => {
    const app = createApp({ port: 3000, environment: 'test', logLevel: 'silent' });
    const imported = await request(app).post('/spec/import').send(openApi3Document);

    expect(imported.status).toBe(201);
    expect(imported.body).toMatchObject({ id: 'Pet API', specificationVersion: '3.0' });
    expect(imported.body.operations[0]).toMatchObject({ id: 'getPet', method: 'GET', path: '/pets/{petId}' });

    const specId = encodeURIComponent(imported.body.id);
    const operations = await request(app).get(`/spec/${specId}/operations`);
    const tags = await request(app).get(`/spec/${specId}/tags`);

    expect(operations.status).toBe(200);
    expect(operations.body).toHaveLength(1);
    expect(tags.body).toEqual(['pets']);
  });

  it('validates documents and rejects structurally invalid input', async () => {
    const app = createApp({ port: 3000, environment: 'test', logLevel: 'silent' });

    await expect(request(app).post('/spec/validate').send(openApi3Document))
      .resolves.toMatchObject({ status: 200, body: { valid: true } });
    await expect(request(app).post('/spec/validate').send({ info: { title: 'Missing version' } }))
      .resolves.toMatchObject({ status: 400, body: { valid: false } });
  });

  it('returns not found for an unknown specification', async () => {
    const response = await request(createApp({ port: 3000, environment: 'test', logLevel: 'silent' }))
      .get('/spec/unknown');

    expect(response.status).toBe(404);
  });
});