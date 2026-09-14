import type { AxiosRequestConfig } from 'axios';
import type { EnvironmentConfig } from '../../domain/models/EnvironmentConfig';
import type { NormalizedSpec } from '../../domain/models/NormalizedSpec';
import type { RunPlan } from '../../domain/models/RunPlan';
import type { RunReport, RunReportAggregate, TestResult } from '../../domain/models/RunReport';
import type { Operation } from '../../domain/models/Operation';
import type { RunPlanRepository } from '../../domain/repositories/RunPlanRepository';
import type { RunReportRepository } from '../../domain/repositories/RunReportRepository';
import type { EnvironmentRepository } from '../../domain/repositories/EnvironmentRepository';
import type { SpecRepository } from '../../domain/repositories/SpecRepository';
import type { TestCaseDefinition } from '../../domain/models/TestCaseDefinition';
import type { AuthConfig } from '../../domain/types';
import { DefaultAxiosClient, type AxiosClient } from '../../infrastructure/http/AxiosClient';
import { request as playwrightRequest, type APIRequestContext } from 'playwright';

export class ExecuteRunUseCase {
  constructor(
    private readonly plans: RunPlanRepository,
    private readonly reports: RunReportRepository,
    private readonly specs: SpecRepository,
    private readonly environments: EnvironmentRepository,
    private readonly client: AxiosClient = new DefaultAxiosClient(),
  ) {}

  async execute(input: { runId?: string; specId?: string; envName?: string; operationIds?: string[]; tag?: string; all?: boolean; framework?: 'axios' | 'playwright' }): Promise<RunReport> {
    let plan = input.runId ? await this.plans.findById(input.runId) : undefined;
    if (!plan) {
      if (!input.specId || !input.envName) throw new Error('runId or specId and envName are required');
      const spec = await this.specs.findById(input.specId);
      if (!spec) throw new Error('Specification not found');
      const operations = selectOperations(spec, input);
      if (!operations.length) throw new Error('No operations matched the requested selection');
      plan = { runId: crypto.randomUUID(), specId: spec.id, envName: input.envName, operations, testCaseDefinitions: operations.flatMap(createDefaultTestCases), status: 'planned', createdAt: new Date().toISOString() };
      await this.plans.save(plan);
    }

    const spec = await this.specs.findById(plan.specId);
    if (!spec) throw new Error('Specification not found');
    const environment = (await this.environments.findBySpecId(plan.specId)).find((candidate) => candidate.name === plan.envName);
    if (!environment) throw new Error(`Environment not found: ${plan.envName}`);
    await this.plans.update({ ...plan, status: 'running' });
    const startedAt = new Date().toISOString();
    const results: TestResult[] = [];
    const playwrightContext = input.framework === 'playwright' ? await playwrightRequest.newContext() : undefined;
    try {
      for (const testCase of plan.testCaseDefinitions) {
        const operation = plan.operations.find((candidate) => candidate.id === testCase.operationId);
        if (!operation) continue;
        results.push(await this.executeTest(spec, operation, environment, testCase, playwrightContext));
        await this.reports.save({ runId: plan.runId, specId: plan.specId, environmentName: plan.envName, framework: input.framework ?? 'axios', status: 'running', startedAt, summary: { total: plan.testCaseDefinitions.length, passed: results.filter((result) => result.status === 'passed').length, failed: results.filter((result) => result.status === 'failed').length, skipped: results.filter((result) => result.status === 'skipped').length }, results: [...results] });
      }
    } finally {
      await playwrightContext?.dispose();
    }
    const summary = { total: results.length, passed: results.filter((result) => result.status === 'passed').length, failed: results.filter((result) => result.status === 'failed').length, skipped: results.filter((result) => result.status === 'skipped').length };
    const report: RunReport = { runId: plan.runId, specId: plan.specId, environmentName: plan.envName, framework: input.framework ?? 'axios', status: summary.failed ? 'failed' : 'passed', startedAt, completedAt: new Date().toISOString(), summary, results };
    await this.plans.update({ ...plan, status: report.status === 'passed' ? 'completed' : 'failed' });
    return this.reports.save(report);
  }

  async status(runId: string): Promise<RunReport> {
    const report = await this.reports.findByRunId(runId);
    if (!report) throw new Error('Run report not found');
    return report;
  }

  async retryFailed(runId: string): Promise<RunReport> {
    const plan = await this.plans.findById(runId);
    if (!plan) throw new Error('Run plan not found');
    const previous = await this.reports.findByRunId(runId);
    if (!previous) throw new Error('Run report not found');
    const failedIds = new Set(previous.results.filter((result) => result.status === 'failed' || result.error).map((result) => result.testCaseId));
    if (!failedIds.size) return previous;
    return this.executePlan(plan, failedIds, previous);
  }

  async aggregate(runId: string): Promise<RunReport['aggregates']> {
    const report = await this.status(runId);
    const plan = await this.plans.findById(runId);
    if (!plan) throw new Error('Run plan not found');
    const operations = new Map(plan.operations.map((operation) => [operation.id, operation]));
    return {
      byTag: aggregateResults(report.results, (result) => operations.get(result.operationId)?.tags ?? []),
      byMethod: aggregateResults(report.results, (result) => { const method = operations.get(result.operationId)?.method; return method ? [method] : []; }),
      byPath: aggregateResults(report.results, (result) => { const path = operations.get(result.operationId)?.path; return path ? [path] : []; }),
    };
  }

  private async executePlan(plan: RunPlan, testCaseIds?: Set<string>, previous?: RunReport): Promise<RunReport> {
    const spec = await this.specs.findById(plan.specId);
    if (!spec) throw new Error('Specification not found');
    const environment = (await this.environments.findBySpecId(plan.specId)).find((candidate) => candidate.name === plan.envName);
    if (!environment) throw new Error(`Environment not found: ${plan.envName}`);
    await this.plans.update({ ...plan, status: 'running' });
    const attempted = testCaseIds
      ? plan.testCaseDefinitions.filter((testCase) => testCaseIds.has(testCase.id ?? `${testCase.operationId}-${testCase.testType}`))
      : plan.testCaseDefinitions;
    const retriedResults: TestResult[] = [];
    for (const testCase of attempted) {
      const operation = plan.operations.find((candidate) => candidate.id === testCase.operationId);
      if (!operation) continue;
      retriedResults.push(await this.executeTest(spec, operation, environment, testCase));
    }
    const results = previous
      ? previous.results.map((result) => retriedResults.find((retry) => retry.testCaseId === result.testCaseId) ?? result)
      : retriedResults;
    const summary = { total: results.length, passed: results.filter((result) => result.status === 'passed').length, failed: results.filter((result) => result.status === 'failed').length, skipped: results.filter((result) => result.status === 'skipped').length };
    const report: RunReport = {
      runId: plan.runId,
      specId: plan.specId,
      environmentName: plan.envName,
      ...(previous?.framework ? { framework: previous.framework } : {}),
      status: summary.failed ? 'failed' : 'passed',
      startedAt: previous?.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      summary,
      results,
      ...(previous ? { retryHistory: [...(previous.retryHistory ?? []), { attemptedAt: new Date().toISOString(), testCaseIds: attempted.map((testCase) => testCase.id ?? `${testCase.operationId}-${testCase.testType}`), results: retriedResults }] } : {}),
    };
    await this.plans.update({ ...plan, status: report.status === 'passed' ? 'completed' : 'failed' });
    return this.reports.save(report);
  }

  private async executeTest(spec: NormalizedSpec, operation: Operation, environment: EnvironmentConfig, testCase: TestCaseDefinition, playwrightContext?: APIRequestContext): Promise<TestResult> {
    const config = buildRequest(spec, operation, environment, testCase);
    const started = Date.now();
    try {
      const actualStatus = playwrightContext
        ? (await playwrightContext.fetch(toPlaywrightUrl(config.url ?? '', config.params), { method: config.method, headers: config.headers as Record<string, string>, data: config.data, timeout: config.timeout, failOnStatusCode: false })).status()
        : (await this.client.request(config)).status;
      return { testCaseId: testCase.id ?? `${operation.id}-${testCase.testType}`, operationId: operation.id, status: actualStatus === testCase.expectedStatus ? 'passed' : 'failed', expectedStatus: testCase.expectedStatus, actualStatus, durationMs: Date.now() - started };
    } catch (error) {
      const actualStatus = isAxiosError(error) ? error.response?.status : undefined;
      return { testCaseId: testCase.id ?? `${operation.id}-${testCase.testType}`, operationId: operation.id, status: actualStatus === testCase.expectedStatus ? 'passed' : 'failed', expectedStatus: testCase.expectedStatus, ...(actualStatus ? { actualStatus } : {}), durationMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

function toPlaywrightUrl(url: string, params: Record<string, unknown> | undefined): string {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) target.searchParams.set(key, String(value));
  }
  return target.toString();
}

function aggregateResults(results: TestResult[], keysFor: (result: TestResult) => string[]): RunReportAggregate[] {
  const groups = new Map<string, RunReportAggregate>();
  for (const result of results) {
    for (const key of keysFor(result)) {
      const aggregate = groups.get(key) ?? { key, total: 0, passed: 0, failed: 0 };
      aggregate.total += 1;
      if (result.status === 'passed') aggregate.passed += 1;
      if (result.status === 'failed') aggregate.failed += 1;
      groups.set(key, aggregate);
    }
  }
  return [...groups.values()].sort((left, right) => left.key.localeCompare(right.key));
}

function buildRequest(spec: NormalizedSpec, operation: Operation, environment: EnvironmentConfig, testCase: TestCaseDefinition): AxiosRequestConfig {
  const values: Record<string, unknown> = {};
  for (const parameter of operation.parameters) values[parameter.name] = parameter.example ?? exampleFromSchema(parameter.schema) ?? (parameter.required ? `sample-${parameter.name}` : undefined);
  let path = operation.path.replace(/\{([^}]+)\}/g, (_match, name: string) => encodeURIComponent(String(values[name] ?? name)));
  const specServer = spec.servers[0]?.url?.replace(/\/$/, '');
  const baseUrl = resolveBaseUrl(specServer, environment.baseUrl);
  if (baseUrl) path = `${baseUrl}${path}`;
  else path = `${specServer ?? ''}${path}`;
  const params: Record<string, unknown> = {};
  const headers = { ...environment.headers, ...testCase.headers };
  for (const parameter of operation.parameters) {
    if (parameter.location === 'query' && values[parameter.name] !== undefined) params[parameter.name] = values[parameter.name];
    if (parameter.location === 'header' && values[parameter.name] !== undefined) headers[parameter.name] = String(values[parameter.name]);
  }
  applyAuth(headers, params, environment.auth, testCase.testType === 'authentication-error');
  return { url: path, method: operation.method, params, headers, timeout: environment.timeoutMs, ...(operation.requestBody && testCase.payloadStrategy !== 'none' ? { data: testCase.payload ?? operation.requestBody.example ?? exampleFromSchema(operation.requestBody.schema) } : {}) };
}

function resolveBaseUrl(specServer: string | undefined, environmentBaseUrl: string): string {
  const environmentUrl = environmentBaseUrl.replace(/\/$/, '');
  if (!environmentUrl || !specServer) return environmentUrl;

  try {
    const environmentAddress = new URL(environmentUrl);
    const serverAddress = new URL(specServer, environmentAddress);
    if (environmentAddress.pathname === '/' && serverAddress.pathname !== '/') {
      return `${environmentAddress.origin}${serverAddress.pathname}`.replace(/\/$/, '');
    }
  } catch {
    return environmentUrl;
  }

  return environmentUrl;
}

function applyAuth(headers: Record<string, string>, params: Record<string, unknown>, auth: AuthConfig | undefined, omit: boolean): void {
  if (!auth || omit) return;
  if (auth.type === 'bearer') headers.authorization = `Bearer ${auth.token}`;
  if (auth.type === 'basic') headers.authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`;
  if (auth.type === 'apiKey') auth.location === 'header' ? headers[auth.key] = auth.value : params[auth.key] = auth.value;
}

function exampleFromSchema(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return undefined;
  const value = schema as Record<string, unknown>;
  if (value.example !== undefined) return value.example;
  if (value.default !== undefined) return value.default;
  if (value.enum && Array.isArray(value.enum)) return value.enum[0];
  if (value.type === 'object' || value.properties) return Object.fromEntries(Object.entries((value.properties ?? {}) as Record<string, unknown>).map(([key, child]) => [key, exampleFromSchema(child)]).filter(([, child]) => child !== undefined));
  if (value.type === 'array') return [exampleFromSchema(value.items)];
  if (value.type === 'integer' || value.type === 'number') return 1;
  if (value.type === 'boolean') return true;
  if (value.type === 'string') return 'example';
  return undefined;
}

function createDefaultTestCases(operation: Operation): TestCaseDefinition[] {
  const success = operation.responses.find((response) => response.status >= 200 && response.status < 300);
  return [{ id: `${operation.id}-happy-path`, operationId: operation.id, name: `${operation.id} happy path`, testType: 'happy-path', expectedStatus: success?.status ?? 200, payloadStrategy: operation.requestBody?.example !== undefined ? 'example' : operation.requestBody?.schema ? 'schema' : 'none', payload: operation.requestBody?.example }];
}

function selectOperations(spec: NormalizedSpec, input: { operationIds?: string[]; tag?: string; all?: boolean }): Operation[] {
  if (input.all) return spec.operations;
  if (input.operationIds?.length) return spec.operations.filter((operation) => input.operationIds?.includes(operation.id));
  if (input.tag) return spec.operations.filter((operation) => operation.tags.includes(input.tag as string));
  return [];
}

function isAxiosError(error: unknown): error is { response?: { status?: number } } { return typeof error === 'object' && error !== null && 'response' in error; }
