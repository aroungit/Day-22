import { randomUUID } from 'node:crypto';
import type { EnvironmentConfig } from '../../domain/models/EnvironmentConfig';
import type { EnvironmentRepository } from '../../domain/repositories/EnvironmentRepository';

export class InMemoryEnvironmentRepository implements EnvironmentRepository {
  private readonly environments = new Map<string, EnvironmentConfig>();

  async save(environment: EnvironmentConfig): Promise<EnvironmentConfig> {
    const saved = { ...environment, id: environment.id ?? randomUUID() };
    this.environments.set(saved.id, saved);
    return saved;
  }

  async findById(id: string): Promise<EnvironmentConfig | undefined> {
    return this.environments.get(id);
  }

  async findBySpecId(specId: string): Promise<EnvironmentConfig[]> {
    return [...this.environments.values()].filter((environment) => environment.specId === specId);
  }

  async deleteById(id: string): Promise<boolean> {
    return this.environments.delete(id);
  }
}