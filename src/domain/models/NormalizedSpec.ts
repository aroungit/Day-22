import type { ServerDefinition } from '../types';
import type { Operation } from './Operation';

export interface NormalizedSpec {
  id: string;
  title: string;
  version: string;
  servers: ServerDefinition[];
  operations: Operation[];
  specificationVersion?: '2.0' | '3.0' | '3.1';
  importedAt?: string;
}