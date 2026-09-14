import request from 'supertest';
import { createApp } from '../../core/app';
import { ExecuteRunUseCase } from '../../application/execution/executeRun.usecase';
import { InMemoryEnvironmentRepository } from '../../infrastructure/persistence/InMemoryEnvironmentRepository';
import { InMemoryRunPlanRepository } from '../../infrastructure/persistence/InMemoryRunPlanRepository';
import { InMemoryRunReportRepository } from '../../infrastructure/persistence/InMemoryRunReportRepository';
import { InMemorySpecRepository } from '../../infrastructure/persistence/InMemorySpecRepository';
import type { AxiosClient } from '../../infrastructure/http/AxiosClient';
import type { AxiosResponse } from 'axios';

const document = {
  openapi: '3.0.3',
  info: { title: 'Retry API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        tags: ['pets'],
        responses: { '200': { description: 'ok' } },
      },
    },
  },
};

describe('Phase 11 retry and reporting APIs', () => {
  it('keeps the imported server base path when an environment only overrides the host', async () => {
    const specs = new InMemorySpecRepository();
    const environments = new InMemoryEnvironmentRepository();
    const plans = new InMemoryRunPlanRepository();
    const reports = new InMemoryRunReportRepository();
    const spec = await specs.save({
      id: 'Swagger Petstore', title: 'Swagger Petstore', version: '1.0.0',
      servers: [{ url: 'https://petstore.swagger.io/v2' }],
      operations: [{ id: 'getInventory', method: 'GET', path: '/store/inventory', tags: ['store'], parameters: [], responses: [{ status: 200 }] }],
    });
    await environments.save({ specId: spec.id, name: 'Development', baseUrl: 'https://petstore.swagger.io', headers: {} });
    let requestedUrl = '';
    const client: AxiosClient = { request: async (config) => { requestedUrl = String(config.url); return { status: 200 } as AxiosResponse; } };
    const execution = new ExecuteRunUseCase(plans, reports, specs, environments, client);

    const report = await execution.execute({ specId: spec.id, envName: 'Development', all: true });

    expect(report.summary.passed).toBe(1);
    expect(requestedUrl).toBe('https://petstore.swagger.io/v2/store/inventory');
  });

  it('retries failed cases and preserves passed cases', async () => {
    const app = createApp({ port: 3000, environment: 'test', logLevel: 'silent' });
    const imported = await request(app).post('/spec/import').send(document);
    const specId = imported.body.id;
    const environment = await request(app).post('/environment').send({ specId, name: 'local', baseUrl: 'http://127.0.0.1:1' });
    expect(environment.status).toBe(201);

    const run = await request(app).post('/execution/run').send({ specId, envName: 'local', all: true });
    expect(run.status).toBe(200);
    expect(run.body.summary.failed).toBe(1);
    const retried = await request(app).post('/execution/retry-failed').send({ runId: run.body.runId });

    expect(retried.status).toBe(200);
    expect(retried.body.results).toHaveLength(1);
    expect(retried.body.retryHistory).toHaveLength(1);
    expect(retried.body.retryHistory[0].testCaseIds).toEqual(['listPets-happy-path']);
  });

  it('aggregates results by tag, method, and path', async () => {
    const app = createApp({ port: 3000, environment: 'test', logLevel: 'silent' });
    const imported = await request(app).post('/spec/import').send(document);
    const specId = imported.body.id;
    await request(app).post('/environment').send({ specId, name: 'local', baseUrl: 'http://127.0.0.1:1' });
    const run = await request(app).post('/execution/run').send({ specId, envName: 'local', all: true });
    const aggregate = await request(app).get(`/execution/aggregate/${run.body.runId}`);

    expect(aggregate.status).toBe(200);
    expect(aggregate.body.byTag).toEqual([{ key: 'pets', total: 1, passed: 0, failed: 1 }]);
    expect(aggregate.body.byMethod[0].key).toBe('GET');
    expect(aggregate.body.byPath[0].key).toBe('/pets');
  });
});
