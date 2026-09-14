import { DefaultOpenApiNormalizer } from '../../infrastructure/swagger/OpenApiNormalizer';
import { DefaultSwaggerLoader } from '../../infrastructure/swagger/SwaggerLoader';
import { McpServer } from '../../infrastructure/mcp/common/McpServer';
import { McpToolRegistry } from '../../infrastructure/mcp/common/McpToolRegistry';
import { InMemoryEnvironmentRepository } from '../../infrastructure/persistence/InMemoryEnvironmentRepository';
import { InMemorySpecRepository } from '../../infrastructure/persistence/InMemorySpecRepository';

describe('Phase 3 infrastructure adapters', () => {
  it('normalizes the basic specification metadata without creating operations', () => {
    const normalized = new DefaultOpenApiNormalizer().normalize({
      openapi: '3.0.3',
      info: { title: 'Example API', version: '1.0.0' },
    });

    expect(normalized).toMatchObject({
      id: 'Example API',
      title: 'Example API',
      version: '1.0.0',
      specificationVersion: '3.0',
      operations: [],
    });
  });

  it('supports repository CRUD and generated environment ids', async () => {
    const specs = new InMemorySpecRepository();
    const environments = new InMemoryEnvironmentRepository();
    const spec = {
      id: 'example',
      title: 'Example',
      version: '1.0.0',
      servers: [],
      operations: [],
    };

    await specs.save(spec);
    const environment = await environments.save({
      name: 'local',
      specId: spec.id,
      baseUrl: 'http://localhost:3000',
      headers: {},
    });

    expect(await specs.findById(spec.id)).toEqual(spec);
    expect(environment.id).toEqual(expect.any(String));
    expect(await environments.findBySpecId(spec.id)).toEqual([environment]);
    expect(await specs.deleteById(spec.id)).toBe(true);
  });

  it('dispatches registered MCP tools', async () => {
    const registry = new McpToolRegistry();
    registry.register({ name: 'echo', handler: (input) => input });
    const server = new McpServer('test', registry);

    expect(await server.callTool('echo', { ready: true })).toEqual({ ready: true });
    expect(server.listTools()).toHaveLength(1);
  });

  it('keeps Git loading explicitly unsupported in the skeleton', async () => {
    await expect(new DefaultSwaggerLoader().loadFromGit('repo', 'swagger.json'))
      .rejects.toThrow('not implemented');
  });
});