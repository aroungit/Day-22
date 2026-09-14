import type { CreateRunPlanUseCase } from '../../../application/execution/createRunPlan.usecase';
import type { ExecuteRunUseCase } from '../../../application/execution/executeRun.usecase';
import type { GenerateAxiosTestsUseCase } from '../../../application/testgen/generateAxiosTests.usecase';
import type { SpecRepository } from '../../../domain/repositories/SpecRepository';
import type { McpTool } from '../common/McpToolRegistry';

export function createSwaggerMcpTools(specs: SpecRepository, planning: CreateRunPlanUseCase, execution: ExecuteRunUseCase, generation: GenerateAxiosTestsUseCase): McpTool[] {
  return [
    { name: 'listOperations', handler: async (input: unknown) => { const spec = await specs.findById((input as { specId: string }).specId); if (!spec) throw new Error('Specification not found'); return spec.operations; } },
    { name: 'planApiRun', handler: (input: unknown) => planning.execute(input as Parameters<CreateRunPlanUseCase['execute']>[0]) },
    { name: 'executeOperation', handler: (input: unknown) => execution.execute(input as Parameters<ExecuteRunUseCase['execute']>[0]) },
    { name: 'generateAxiosTests', handler: (input: unknown) => generation.execute(input as Parameters<GenerateAxiosTestsUseCase['execute']>[0]) },
  ];
}
