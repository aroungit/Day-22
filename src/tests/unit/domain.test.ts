import { failure, success, type Result } from '../../utils/result';
import type { EnvironmentConfig } from '../../domain/models/EnvironmentConfig';
import type { Operation } from '../../domain/models/Operation';

describe('domain contracts', () => {
  it('supports typed success and failure results', () => {
    const successful: Result<string, Error> = success('ready');
    const unsuccessful: Result<string, Error> = failure(new Error('invalid'));

    expect(successful).toEqual({ ok: true, value: 'ready' });
    expect(unsuccessful.ok).toBe(false);
  });

  it('keeps domain models independent from infrastructure concerns', () => {
    const operation: Operation = {
      id: 'get-users',
      method: 'GET',
      path: '/users',
      tags: ['users'],
      parameters: [],
      responses: [{ status: 200 }],
    };
    const environment: EnvironmentConfig = {
      id: 'local',
      specId: 'users-api',
      name: 'local',
      baseUrl: 'http://localhost:3000',
      headers: {},
    };

    expect(operation.method).toBe('GET');
    expect(environment.baseUrl).toBe('http://localhost:3000');
  });
});