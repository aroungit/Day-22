import type { RunPlan } from '../../domain/models/RunPlan';
import type { RunPlanRepository } from '../../domain/repositories/RunPlanRepository';

export class InMemoryRunPlanRepository implements RunPlanRepository {
  private readonly plans = new Map<string, RunPlan>();

  async save(plan: RunPlan): Promise<RunPlan> {
    this.plans.set(plan.runId, plan);
    return plan;
  }

  async findById(runId: string): Promise<RunPlan | undefined> {
    return this.plans.get(runId);
  }

  async update(plan: RunPlan): Promise<RunPlan> {
    if (!this.plans.has(plan.runId)) {
      throw new Error(`Run plan not found: ${plan.runId}`);
    }
    this.plans.set(plan.runId, plan);
    return plan;
  }
}