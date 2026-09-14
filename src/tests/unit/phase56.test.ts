import request from 'supertest';
import { createApp } from '../../core/app';

const document = {
  openapi: '3.0.3',
  info: { title: 'Planning API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets', tags: ['pets'], security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'ok' }, '401': { description: 'unauthorized' } },
      },
    },
    '/pets/{petId}': {
      post: {
        operationId: 'createPet', tags: ['admin'],
        parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' }, example: { name: 'Milo' } } } },
        responses: { '201': { description: 'created' }, '422': { description: 'invalid' } },
      },
    },
  },
};

describe('Phase 5 and 6 APIs', () => {
  it('manages environments and isolates them by specification', async () => {
    const app = createApp({ port: 3000, environment: 'test', logLevel: 'silent' });
    const imported = await request(app).post('/spec/import').send(document);
    const specId = imported.body.id;

    const created = await request(app).post('/environment').send({ specId, name: 'local', baseUrl: 'http://localhost:4000', headers: { 'x-test': 'true' } });
    expect(created.status).toBe(201);
    expect((await request(app).get(`/spec/${encodeURIComponent(specId)}/environments`)).body).toHaveLength(1);
    expect((await request(app).post('/environment').send({ specId, name: 'bad', baseUrl: 'ftp://localhost' })).status).toBe(400);

    const updated = await request(app).put(`/environment/${created.body.id}`).send({ specId, name: 'staging', baseUrl: 'https://staging.example.com', headers: {} });
    expect(updated.status).toBe(200);
    expect((await request(app).delete(`/environment/${created.body.id}`)).status).toBe(204);
    expect((await request(app).get(`/environment/${created.body.id}`)).status).toBe(404);
  });

  it('creates plans by operation, tag, and full specification', async () => {
    const app = createApp({ port: 3000, environment: 'test', logLevel: 'silent' });
    const imported = await request(app).post('/spec/import').send(document);
    const specId = imported.body.id;

    const operationPlan = await request(app).post('/execution/plan').send({ specId, envName: 'local', operationIds: ['listPets'] });
    expect(operationPlan.status).toBe(201);
    expect(operationPlan.body.operations).toHaveLength(1);
    expect(operationPlan.body.testCaseDefinitions.map((testCase: { testType: string }) => testCase.testType)).toEqual(['happy-path', 'authentication-error']);

    const tagPlan = await request(app).post('/execution/plan').send({ specId, envName: 'local', tag: 'admin' });
    expect(tagPlan.status).toBe(201);
    expect(tagPlan.body.testCaseDefinitions.map((testCase: { testType: string }) => testCase.testType)).toEqual(['happy-path', 'validation-error']);

    const fullPlan = await request(app).post('/execution/plan').send({ specId, envName: 'local', all: true });
    expect(fullPlan.status).toBe(201);
    expect(fullPlan.body.operations).toHaveLength(2);
    expect((await request(app).post('/execution/plan').send({ specId, envName: 'local', tag: 'missing' })).status).toBe(404);
  });
});