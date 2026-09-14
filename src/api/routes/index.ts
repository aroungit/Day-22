import { Router } from 'express';
import type { AppConfig } from '../../core/config';
import type { HealthResponse } from '../../core/types';
import { IngestSwaggerUseCase } from '../../application/specification/ingestSwagger.usecase';
import type { SpecRepository } from '../../domain/repositories/SpecRepository';
import { InMemorySpecRepository } from '../../infrastructure/persistence/InMemorySpecRepository';
import type { EnvironmentRepository } from '../../domain/repositories/EnvironmentRepository';
import type { RunPlanRepository } from '../../domain/repositories/RunPlanRepository';
import { InMemoryEnvironmentRepository } from '../../infrastructure/persistence/InMemoryEnvironmentRepository';
import { InMemoryRunPlanRepository } from '../../infrastructure/persistence/InMemoryRunPlanRepository';
import { ManageEnvironmentUseCase } from '../../application/environment/manageEnvironment.usecase';
import { CreateRunPlanUseCase } from '../../application/execution/createRunPlan.usecase';
import { ExecuteRunUseCase } from '../../application/execution/executeRun.usecase';
import { GenerateAxiosTestsUseCase } from '../../application/testgen/generateAxiosTests.usecase';
import { BuildPayloadFromSchemaUseCase } from '../../application/llm/buildPayloadFromSchema.usecase';
import type { RunReportRepository } from '../../domain/repositories/RunReportRepository';
import { InMemoryRunReportRepository } from '../../infrastructure/persistence/InMemoryRunReportRepository';
import { UnconfiguredPayloadBuilderLlmClient } from '../../infrastructure/llm/PayloadBuilderLlmClient';
import { createSwaggerMcpTools } from '../../infrastructure/mcp/swagger/tools';
import { logger } from '../../infrastructure/logging/Logger';

export function createRoutes(config: AppConfig, specs: SpecRepository = new InMemorySpecRepository(), environments: EnvironmentRepository = new InMemoryEnvironmentRepository(), plans: RunPlanRepository = new InMemoryRunPlanRepository(), reports: RunReportRepository = new InMemoryRunReportRepository()): Router {
  const router = Router();
  const ingestion = new IngestSwaggerUseCase(specs);
  const environmentManagement = new ManageEnvironmentUseCase(environments, specs);
  const runPlanning = new CreateRunPlanUseCase(specs, plans);
  const runExecution = new ExecuteRunUseCase(plans, reports, specs, environments);
  const testGeneration = new GenerateAxiosTestsUseCase(specs, plans);
  const payloadBuilder = new BuildPayloadFromSchemaUseCase(new UnconfiguredPayloadBuilderLlmClient());
  const mcpTools = createSwaggerMcpTools(specs, runPlanning, runExecution, testGeneration);

  router.get('/health', (_request, response) => {
    const payload: HealthResponse = {
      status: 'ok',
      service: 'swagger-ai-agent',
      environment: config.environment,
    };
    response.status(200).json(payload);
  });

  router.post('/spec/import', async (request, response) => {
    try {
      const body = request.body as { document?: unknown; source?: { type: 'url' | 'file'; url?: string; path?: string } };
      const imported = body.source
        ? await ingestion.importSource(body.source.type === 'url'
          ? { type: 'url', url: String(body.source.url ?? '') }
          : { type: 'file', path: String(body.source.path ?? '') })
        : await ingestion.importDocument(body.document ?? body);
      response.status(201).json(imported);
    } catch (error) {
      response.status(400).json({ error: getErrorMessage(error) });
    }
  });

  router.post('/spec/validate', async (request, response) => {
    try {
      await ingestion.validate(request.body?.document ?? request.body);
      response.status(200).json({ valid: true });
    } catch (error) {
      response.status(400).json({ valid: false, error: getErrorMessage(error) });
    }
  });

  router.get('/spec/:specId/operations', async (request, response) => {
    const spec = await specs.findById(request.params.specId);
    if (!spec) return response.status(404).json({ error: 'Specification not found' });
    return response.status(200).json(spec.operations);
  });

  router.get('/spec/:specId/tags', async (request, response) => {
    const spec = await specs.findById(request.params.specId);
    if (!spec) return response.status(404).json({ error: 'Specification not found' });
    return response.status(200).json([...new Set(spec.operations.flatMap((operation) => operation.tags))].sort());
  });

  router.get('/spec/:specId', async (request, response) => {
    const spec = await specs.findById(request.params.specId);
    if (!spec) return response.status(404).json({ error: 'Specification not found' });
    return response.status(200).json(spec);
  });

  router.post('/environment', async (request, response) => {
    try { return response.status(201).json(await environmentManagement.create(request.body)); }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.get('/spec/:specId/environments', async (request, response) => {
    try { return response.status(200).json(await environmentManagement.list(request.params.specId)); }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.get('/environment/:envId', async (request, response) => {
    try { return response.status(200).json(await environmentManagement.get(request.params.envId)); }
    catch (error) { return response.status(404).json({ error: getErrorMessage(error) }); }
  });
  router.put('/environment/:envId', async (request, response) => {
    try { return response.status(200).json(await environmentManagement.update(request.params.envId, request.body)); }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.delete('/environment/:envId', async (request, response) => {
    try { await environmentManagement.delete(request.params.envId); return response.status(204).send(); }
    catch (error) { return response.status(404).json({ error: getErrorMessage(error) }); }
  });
  router.post('/execution/plan', async (request, response) => {
    try { return response.status(201).json(await runPlanning.execute(request.body)); }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.post('/execution/run', async (request, response) => {
    try {
      const input = request.body as { runId?: string };
      if (!request.body?.async) return response.status(200).json(await runExecution.execute(request.body));
      const runId = input.runId ?? crypto.randomUUID();
      const plan = await plans.findById(runId);
      if (!plan) throw new Error('Run plan not found');
      const startedAt = new Date().toISOString();
      await reports.save({ runId, specId: plan.specId, environmentName: plan.envName, framework: request.body?.framework === 'playwright' ? 'playwright' : 'axios', status: 'running', startedAt, summary: { total: plan.testCaseDefinitions.length, passed: 0, failed: 0, skipped: 0 }, results: [] });
      void runExecution.execute({ ...request.body, runId }).catch(async (error) => {
        const current = await reports.findByRunId(runId);
        if (current) await reports.save({ ...current, status: 'failed', completedAt: new Date().toISOString(), summary: { ...current.summary, failed: Math.max(1, current.summary.failed) }, results: current.results });
        logger.error('Async execution failed', { runId, error: getErrorMessage(error) });
      });
      return response.status(202).json(await reports.findByRunId(runId));
    }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.get('/execution/status/:runId', async (request, response) => {
    try { return response.status(200).json(await runExecution.status(request.params.runId)); }
    catch (error) { return response.status(404).json({ error: getErrorMessage(error) }); }
  });
  router.get('/execution/runs', async (request, response) => {
    try { return response.status(200).json(await reports.list({ page: Number(request.query.page) || 1, pageSize: Number(request.query.pageSize) || 10, status: request.query.status as 'running' | 'passed' | 'failed' | 'cancelled' | undefined })); }
    catch (error) { return response.status(400).json({ error: getErrorMessage(error) }); }
  });
  router.post('/execution/retry-failed', async (request, response) => {
    try { return response.status(200).json(await runExecution.retryFailed(String(request.body?.runId ?? ''))); }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.get('/execution/aggregate/:runId', async (request, response) => {
    try { return response.status(200).json(await runExecution.aggregate(request.params.runId)); }
    catch (error) { return response.status(404).json({ error: getErrorMessage(error) }); }
  });
  router.post('/testgen/generate-axios-tests', async (request, response) => {
    try { return response.status(200).json(await testGeneration.execute(request.body)); }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.post('/testgen/generate-playwright-tests', async (request, response) => {
    try { return response.status(200).json(await testGeneration.executePlaywright(request.body)); }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.get('/testgen/spec/:specId/preview', async (request, response) => {
    try { return response.status(200).json(await testGeneration.preview(request.params.specId)); }
    catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
  });
  router.post('/llm/build-payload', async (request, response) => {
    try { return response.status(200).json(await payloadBuilder.execute(request.body)); }
    catch (error) { return response.status(400).json({ error: getErrorMessage(error) }); }
  });
  for (const tool of mcpTools) {
    router.post(`/mcp/swagger/${tool.name.replace(/[A-Z]/g, (letter: string) => `-${letter.toLowerCase()}`)}`, async (request, response) => {
      try { return response.status(200).json(await tool.handler(request.body)); }
      catch (error) { return response.status(errorMessageStatus(error)).json({ error: getErrorMessage(error) }); }
    });
  }

  return router;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorMessageStatus(error: unknown): number {
  return getErrorMessage(error).includes('not found') || getErrorMessage(error).includes('Unknown ') ? 404 : 400;
}
