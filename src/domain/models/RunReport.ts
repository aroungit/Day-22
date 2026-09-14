import type { TestResultStatus } from '../types';

export interface TestResult {
  testCaseId: string;
  operationId: string;
  status: TestResultStatus;
  expectedStatus: number;
  actualStatus?: number;
  durationMs?: number;
  error?: string;
}

export interface RunReportSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface RunReportAggregate {
  key: string;
  total: number;
  passed: number;
  failed: number;
}

export interface RetrySnapshot {
  attemptedAt: string;
  testCaseIds: string[];
  results: TestResult[];
}

export interface RunReport {
  runId: string;
  specId: string;
  environmentName: string;
  framework?: 'axios' | 'playwright';
  status: 'running' | 'passed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  summary: RunReportSummary;
  results: TestResult[];
  aggregates?: {
    byTag: RunReportAggregate[];
    byMethod: RunReportAggregate[];
    byPath: RunReportAggregate[];
  };
  retryHistory?: RetrySnapshot[];
}