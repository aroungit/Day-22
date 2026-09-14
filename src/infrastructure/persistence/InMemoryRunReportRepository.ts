import type { RunReport } from '../../domain/models/RunReport';
import type { RunReportRepository } from '../../domain/repositories/RunReportRepository';

export class InMemoryRunReportRepository implements RunReportRepository {
  private readonly reports = new Map<string, RunReport>();

  async save(report: RunReport): Promise<RunReport> {
    this.reports.set(report.runId, report);
    return report;
  }

  async findByRunId(runId: string): Promise<RunReport | undefined> {
    return this.reports.get(runId);
  }

  async list(input: { page?: number; pageSize?: number; status?: RunReport['status'] } = {}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 10));
    const filtered = [...this.reports.values()].filter((report) => !input.status || report.status === input.status).sort((left, right) => (right.completedAt ?? right.startedAt).localeCompare(left.completedAt ?? left.startedAt));
    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), page, pageSize, total: filtered.length, pages: Math.ceil(filtered.length / pageSize) };
  }
}
