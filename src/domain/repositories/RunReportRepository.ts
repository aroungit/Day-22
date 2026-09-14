import type { RunReport } from '../models/RunReport';

export interface RunReportRepository {
  save(report: RunReport): Promise<RunReport>;
  findByRunId(runId: string): Promise<RunReport | undefined>;
  list(input?: { page?: number; pageSize?: number; status?: RunReport['status'] }): Promise<{ items: RunReport[]; page: number; pageSize: number; total: number; pages: number }>;
}
