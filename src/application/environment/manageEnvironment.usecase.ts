import type { EnvironmentConfig } from '../../domain/models/EnvironmentConfig';
import type { EnvironmentRepository } from '../../domain/repositories/EnvironmentRepository';
import type { SpecRepository } from '../../domain/repositories/SpecRepository';

export type EnvironmentInput = Omit<EnvironmentConfig, 'id'>;

export class ManageEnvironmentUseCase {
  constructor(
    private readonly environments: EnvironmentRepository,
    private readonly specs: SpecRepository,
  ) {}

  async create(input: EnvironmentInput): Promise<EnvironmentConfig> {
    await this.assertSpecification(input.specId);
    validateEnvironment(input);
    return this.environments.save(input);
  }

  async list(specId: string): Promise<EnvironmentConfig[]> {
    await this.assertSpecification(specId);
    return this.environments.findBySpecId(specId);
  }

  async get(id: string): Promise<EnvironmentConfig> {
    const environment = await this.environments.findById(id);
    if (!environment) throw new Error('Environment not found');
    return environment;
  }

  async update(id: string, input: EnvironmentInput): Promise<EnvironmentConfig> {
    await this.get(id);
    await this.assertSpecification(input.specId);
    validateEnvironment(input);
    return this.environments.save({ ...input, id });
  }

  async delete(id: string): Promise<void> {
    if (!(await this.environments.deleteById(id))) throw new Error('Environment not found');
  }

  private async assertSpecification(specId: string | undefined): Promise<void> {
    if (!specId || !(await this.specs.findById(specId))) throw new Error('Specification not found');
  }
}

function validateEnvironment(environment: EnvironmentInput): void {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(environment.baseUrl);
  } catch {
    throw new Error('baseUrl must be a valid HTTP or HTTPS URL');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('baseUrl must be a valid HTTP or HTTPS URL');
  if (!environment.name.trim()) throw new Error('name is required');
  for (const [key, value] of Object.entries(environment.headers ?? {})) {
    if (!key.trim() || typeof value !== 'string') throw new Error('headers must contain string values');
  }
  if (environment.auth) {
    if (environment.auth.type === 'basic' && (!environment.auth.username || !environment.auth.password)) throw new Error('basic authentication requires username and password');
    if (environment.auth.type === 'bearer' && !environment.auth.token) throw new Error('bearer authentication requires token');
    if (environment.auth.type === 'apiKey' && (!environment.auth.key || !environment.auth.value)) throw new Error('apiKey authentication requires key and value');
  }
}