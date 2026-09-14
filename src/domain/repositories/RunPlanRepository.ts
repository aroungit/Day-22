import type { RunPlan } from '../models/RunPlan';

export interface RunPlanRepository {
  save(plan: RunPlan): Promise<RunPlan>;
  findById(runId: string): Promise<RunPlan | undefined>;
  update(plan: RunPlan): Promise<RunPlan>;
}