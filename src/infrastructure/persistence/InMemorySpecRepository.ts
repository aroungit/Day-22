import type { NormalizedSpec } from '../../domain/models/NormalizedSpec';
import type { SpecRepository } from '../../domain/repositories/SpecRepository';

export class InMemorySpecRepository implements SpecRepository {
  private readonly specs = new Map<string, NormalizedSpec>();

  async save(spec: NormalizedSpec): Promise<NormalizedSpec> {
    this.specs.set(spec.id, spec);
    return spec;
  }

  async findById(id: string): Promise<NormalizedSpec | undefined> {
    return this.specs.get(id);
  }

  async list(): Promise<NormalizedSpec[]> {
    return [...this.specs.values()];
  }

  async deleteById(id: string): Promise<boolean> {
    return this.specs.delete(id);
  }
}