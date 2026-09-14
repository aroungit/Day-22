import type { PayloadStrategy, TestType } from '../types';

export interface TestCaseDefinition {
  testType: TestType;
  expectedStatus: number;
  payloadStrategy: PayloadStrategy;
  id?: string;
  operationId?: string;
  name?: string;
  payload?: unknown;
  headers?: Record<string, string>;
}