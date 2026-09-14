import type { PayloadBuilderLlmClient } from '../../infrastructure/llm/PayloadBuilderLlmClient';

export interface BuildPayloadRequest { schema?: unknown; example?: unknown; hints?: string; }
export interface BuildPayloadResult { payload: unknown; source: 'example' | 'schema' | 'llm'; unresolvedFields: string[]; }

export class BuildPayloadFromSchemaUseCase {
  constructor(private readonly llm: PayloadBuilderLlmClient) {}

  async execute(request: BuildPayloadRequest): Promise<BuildPayloadResult> {
    if (request.example !== undefined) return { payload: request.example, source: 'example', unresolvedFields: [] };
    const unresolvedFields: string[] = [];
    const payload = buildValue(request.schema, '', unresolvedFields);
    if (!unresolvedFields.length) return { payload, source: 'schema', unresolvedFields };
    try {
      const llmPayload = await this.llm.buildPayload(request.schema, request.hints);
      return { payload: mergeValues(payload, llmPayload), source: 'llm', unresolvedFields };
    } catch {
      return { payload, source: 'schema', unresolvedFields };
    }
  }
}

function buildValue(schema: unknown, path: string, unresolved: string[]): unknown {
  if (!schema || typeof schema !== 'object') { if (path) unresolved.push(path); return undefined; }
  const value = schema as Record<string, unknown>;
  if (value.example !== undefined) return value.example;
  if (value.default !== undefined) return value.default;
  if (Array.isArray(value.enum) && value.enum.length) return value.enum[0];
  if (value.type === 'object' || value.properties) {
    const properties = (value.properties ?? {}) as Record<string, unknown>;
    const required = new Set(Array.isArray(value.required) ? value.required.map(String) : Object.keys(properties));
    return Object.fromEntries(Object.entries(properties).map(([key, child]) => [key, buildValue(child, path ? `${path}.${key}` : key, required.has(key) ? unresolved : [])]).filter(([, child]) => child !== undefined));
  }
  if (value.type === 'array') return [buildValue(value.items, `${path}[0]`, unresolved)];
  if (value.type === 'string') return 'example';
  if (value.type === 'integer' || value.type === 'number') return 1;
  if (value.type === 'boolean') return true;
  if (path) unresolved.push(path);
  return undefined;
}

function mergeValues(base: unknown, fallback: unknown): unknown {
  if (base && fallback && typeof base === 'object' && typeof fallback === 'object' && !Array.isArray(base) && !Array.isArray(fallback)) return { ...(base as object), ...(fallback as object) };
  return fallback ?? base;
}
