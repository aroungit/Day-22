import type { NormalizedSpec } from '../models/NormalizedSpec';

export interface SpecRepository {
  save(spec: NormalizedSpec): Promise<NormalizedSpec>;
  findById(id: string): Promise<NormalizedSpec | undefined>;
  list(): Promise<NormalizedSpec[]>;
  deleteById(id: string): Promise<boolean>;
}