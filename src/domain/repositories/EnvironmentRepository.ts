import type { EnvironmentConfig } from '../models/EnvironmentConfig';

export interface EnvironmentRepository {
  save(environment: EnvironmentConfig): Promise<EnvironmentConfig>;
  findById(id: string): Promise<EnvironmentConfig | undefined>;
  findBySpecId(specId: string): Promise<EnvironmentConfig[]>;
  deleteById(id: string): Promise<boolean>;
}