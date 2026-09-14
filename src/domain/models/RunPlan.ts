import type { RunStatus } from '../types';
import type { Operation } from './Operation';
import type { TestCaseDefinition } from './TestCaseDefinition';

export interface RunPlan {
  runId: string;
  specId: string;
  envName: string;
  operations: Operation[];
  testCaseDefinitions: TestCaseDefinition[];
  status?: RunStatus;
  createdAt?: string;
}