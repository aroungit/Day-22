import type { NormalizedSpec } from '../../domain/models/NormalizedSpec';
import type { TestCaseDefinition } from '../../domain/models/TestCaseDefinition';
import type { SpecRepository } from '../../domain/repositories/SpecRepository';
import type { RunPlanRepository } from '../../domain/repositories/RunPlanRepository';

export interface GenerateTestsRequest { specId: string; operationIds?: string[]; tag?: string; all?: boolean; includePositive?: boolean; includeNegative?: boolean; includeAuthentication?: boolean; includeBoundary?: boolean; baseUrl?: string; }
export interface GeneratedTests { specId: string; code: string; metadata: { operationIds: string[]; testCaseCount: number; options: Omit<GenerateTestsRequest, 'specId'> }; }

export class GenerateAxiosTestsUseCase {
  constructor(private readonly specs: SpecRepository, private readonly plans: RunPlanRepository) {}

  async execute(request: GenerateTestsRequest): Promise<GeneratedTests> {
    const spec = await this.specs.findById(request.specId);
    if (!spec) throw new Error('Specification not found');
    const operations = selectOperations(spec, request);
    if (!operations.length) throw new Error('No operations matched the requested selection');
    const cases = operations.flatMap((operation) => casesFor(operation, request));
    const baseUrl = request.baseUrl ?? spec.servers[0]?.url ?? 'http://localhost:3000';
    const code = render(spec, operations, cases, baseUrl);
    return { specId: spec.id, code, metadata: { operationIds: operations.map((operation) => operation.id), testCaseCount: cases.length, options: { ...request } } };
  }

  async preview(specId: string): Promise<GeneratedTests> {
    return this.execute({ specId, all: true });
  }

  async executePlaywright(request: GenerateTestsRequest): Promise<GeneratedTests> {
    const spec = await this.specs.findById(request.specId);
    if (!spec) throw new Error('Specification not found');
    const operations = selectOperations(spec, request);
    if (!operations.length) throw new Error('No operations matched the requested selection');
    const cases = operations.flatMap((operation) => casesFor(operation, request));
    const baseUrl = request.baseUrl ?? spec.servers[0]?.url ?? 'http://localhost:3000';
    const blocks = operations.map((operation) => cases.filter((testCase) => testCase.operationId === operation.id).map((testCase) => `test(${JSON.stringify(testCase.name ?? testCase.id)}, async ({ request }) => {\n  const response = await request.${operation.method.toLowerCase()}(${JSON.stringify(`${baseUrl}${operation.path}`)});\n  expect(response.status()).toBe(${testCase.expectedStatus});\n});`).join('\n')).filter(Boolean).join('\n\n');
    const code = `import { test, expect } from '@playwright/test';\n\ntest.describe(${JSON.stringify(spec.title)}, () => {\n${blocks}\n});\n`;
    return { specId: spec.id, code, metadata: { operationIds: operations.map((operation) => operation.id), testCaseCount: cases.length, options: { ...request } } };
  }
}

function selectOperations(spec: NormalizedSpec, request: GenerateTestsRequest) {
  if (request.all) return spec.operations;
  if (request.operationIds?.length) return spec.operations.filter((operation) => request.operationIds?.includes(operation.id));
  if (request.tag) return spec.operations.filter((operation) => operation.tags.includes(request.tag as string));
  return [];
}
function casesFor(operation: NormalizedSpec['operations'][number], request: GenerateTestsRequest): TestCaseDefinition[] {
  const result: TestCaseDefinition[] = [];
  if (request.includePositive !== false) result.push({ id: `${operation.id}-happy-path`, operationId: operation.id, testType: 'happy-path', expectedStatus: operation.responses.find((response) => response.status >= 200 && response.status < 300)?.status ?? 200, payloadStrategy: operation.requestBody ? 'schema' : 'none', payload: operation.requestBody?.example });
  if (request.includeNegative) result.push({ id: `${operation.id}-validation-error`, operationId: operation.id, testType: 'validation-error', expectedStatus: operation.responses.find((response) => response.status === 400 || response.status === 422)?.status ?? 400, payloadStrategy: 'custom' });
  if (request.includeAuthentication && operation.security?.length) result.push({ id: `${operation.id}-authentication-error`, operationId: operation.id, testType: 'authentication-error', expectedStatus: operation.responses.find((response) => response.status === 401 || response.status === 403)?.status ?? 401, payloadStrategy: 'none' });
  if (request.includeBoundary) result.push({ id: `${operation.id}-boundary`, operationId: operation.id, testType: 'boundary', expectedStatus: operation.responses[0]?.status ?? 200, payloadStrategy: operation.requestBody ? 'schema' : 'none' });
  return result;
}
function render(spec: NormalizedSpec, operations: NormalizedSpec['operations'], cases: TestCaseDefinition[], baseUrl: string): string {
  const blocks = operations.map((operation) => {
    const operationCases = cases.filter((testCase) => testCase.operationId === operation.id);
    const tests = operationCases.map((testCase) => `  it(${JSON.stringify(testCase.name ?? testCase.id)}, async () => {\n    const response = await axios.request({ method: ${JSON.stringify(operation.method)}, url: ${JSON.stringify(`${baseUrl}${operation.path}`)}, data: ${JSON.stringify(testCase.payload ?? null)} });\n    expect(response.status).toBe(${testCase.expectedStatus});\n  });`).join('\n');
    return `describe(${JSON.stringify(operation.tags[0] ?? operation.path)}, () => {\n${tests}\n});`;
  }).join('\n\n');
  return `import axios from 'axios';\n\ndescribe(${JSON.stringify(spec.title)}, () => {\n${blocks}\n});\n`;
}
