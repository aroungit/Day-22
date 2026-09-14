import { randomUUID } from 'node:crypto';
import type { NormalizedSpec } from '../../domain/models/NormalizedSpec';
import type { RunPlan } from '../../domain/models/RunPlan';
import type { TestCaseDefinition } from '../../domain/models/TestCaseDefinition';
import type { SpecRepository } from '../../domain/repositories/SpecRepository';
import type { RunPlanRepository } from '../../domain/repositories/RunPlanRepository';

export interface PlanRequest { specId: string; envName: string; operationIds?: string[]; tag?: string; all?: boolean }

export class CreateRunPlanUseCase {
  constructor(private readonly specs: SpecRepository, private readonly plans: RunPlanRepository) {}

  async execute(request: PlanRequest): Promise<RunPlan> {
    const spec = await this.specs.findById(request.specId);
    if (!spec) throw new Error('Specification not found');
    const operations = selectOperations(spec, request);
    if (operations.length === 0) throw new Error('No operations matched the requested selection');
    return this.plans.save({
      runId: randomUUID(), specId: spec.id, envName: request.envName, operations,
      testCaseDefinitions: operations.flatMap(createTestCases), status: 'planned', createdAt: new Date().toISOString(),
    });
  }
}

function selectOperations(spec: NormalizedSpec, request: PlanRequest) {
  if (!request.all && !request.tag && !request.operationIds?.length) throw new Error('Provide operationIds, tag, or all=true');
  if (request.all) return spec.operations;
  if (request.operationIds?.length) {
    const unknown = request.operationIds.filter((id) => !spec.operations.some((operation) => operation.id === id));
    if (unknown.length) throw new Error(`Unknown operation(s): ${unknown.join(', ')}`);
    return spec.operations.filter((operation) => request.operationIds?.includes(operation.id));
  }
  if (!spec.operations.some((operation) => operation.tags.includes(request.tag as string))) throw new Error(`Unknown tag: ${request.tag}`);
  return spec.operations.filter((operation) => operation.tags.includes(request.tag as string));
}

function createTestCases(operation: NormalizedSpec['operations'][number]): TestCaseDefinition[] {
  const success = operation.responses.find((response) => response.status >= 200 && response.status < 300);
  const cases: TestCaseDefinition[] = [{ id: `${operation.id}-happy-path`, name: `${operation.id} happy path`, operationId: operation.id, testType: 'happy-path', expectedStatus: success?.status ?? 200, payloadStrategy: operation.requestBody?.example !== undefined ? 'example' : operation.requestBody?.schema ? 'schema' : 'none', payload: operation.requestBody?.example }];
  const validation = operation.responses.find((response) => response.status === 400 || response.status === 422);
  if (validation) cases.push({ id: `${operation.id}-validation-error`, name: `${operation.id} validation error`, operationId: operation.id, testType: 'validation-error', expectedStatus: validation.status, payloadStrategy: 'custom' });
  if (operation.security?.length) {
    const auth = operation.responses.find((response) => response.status === 401 || response.status === 403);
    cases.push({ id: `${operation.id}-authentication-error`, name: `${operation.id} authentication error`, operationId: operation.id, testType: 'authentication-error', expectedStatus: auth?.status ?? 401, payloadStrategy: 'none' });
  }
  return cases;
}