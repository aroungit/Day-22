import type { NormalizedSpec } from '../../domain/models/NormalizedSpec';
import type { Operation } from '../../domain/models/Operation';
import type {
  HttpMethod,
  ParameterDefinition,
  RequestBodyDefinition,
  ResponseDefinition,
  SecurityRequirement,
  ServerDefinition,
} from '../../domain/types';

export interface OpenApiNormalizer {
  normalize(spec: unknown): NormalizedSpec;
}

export class DefaultOpenApiNormalizer implements OpenApiNormalizer {
  normalize(spec: unknown): NormalizedSpec {
    const document = isRecord(spec) ? spec : {};
    const info = isRecord(document.info) ? document.info : {};
    const rawVersion = String(document.openapi ?? document.swagger ?? '');
    const specificationVersion = rawVersion === '2.0' || rawVersion.startsWith('2.')
      ? '2.0'
      : rawVersion.startsWith('3.1')
        ? '3.1'
        : rawVersion.startsWith('3.0')
          ? '3.0'
          : undefined;

    return {
      id: String(info.title ?? 'unnamed-spec'),
      title: String(info.title ?? 'Untitled API'),
      version: String(info.version ?? 'unknown'),
      servers: normalizeServers(document, specificationVersion),
      operations: normalizeOperations(document, specificationVersion),
      specificationVersion,
      importedAt: new Date().toISOString(),
    };
  }
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function normalizeServers(document: Record<string, unknown>, specificationVersion: NormalizedSpec['specificationVersion']): ServerDefinition[] {
  if (specificationVersion !== '2.0') {
    return asArray(document.servers).filter(isRecord).map((server) => ({
      url: String(server.url ?? ''),
      ...(server.description ? { description: String(server.description) } : {}),
      ...(isRecord(server.variables) ? { variables: server.variables as ServerDefinition['variables'] } : {}),
    }));
  }

  const schemes = asArray(document.schemes).map(String);
  const host = String(document.host ?? '');
  const basePath = String(document.basePath ?? '');
  return (schemes.length ? schemes : ['http']).map((scheme) => ({
    url: `${scheme}://${host}${basePath}`,
  }));
}

function normalizeOperations(document: Record<string, unknown>, specificationVersion: NormalizedSpec['specificationVersion']): Operation[] {
  const paths = isRecord(document.paths) ? document.paths : {};
  const operations: Operation[] = [];

  for (const [path, pathItemValue] of Object.entries(paths)) {
    if (!isRecord(pathItemValue)) continue;
    const pathParameters = asArray(pathItemValue.parameters).filter(isRecord);
    for (const method of HTTP_METHODS) {
      const rawOperation = pathItemValue[method.toLowerCase()];
      if (!isRecord(rawOperation)) continue;
      const parameters = [...pathParameters, ...asArray(rawOperation.parameters).filter(isRecord)]
        .filter((parameter) => parameter.in !== 'body')
        .map(normalizeParameter);
      const requestBody = specificationVersion === '2.0'
        ? normalizeV2RequestBody(pathParameters, asArray(rawOperation.parameters).filter(isRecord), document)
        : normalizeV3RequestBody(rawOperation.requestBody);
      operations.push({
        id: String(rawOperation.operationId ?? `${method.toLowerCase()}-${path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`),
        method,
        path,
        tags: asArray(rawOperation.tags).map(String),
        ...(rawOperation.summary ? { summary: String(rawOperation.summary) } : {}),
        ...(rawOperation.description ? { description: String(rawOperation.description) } : {}),
        parameters,
        ...(requestBody ? { requestBody } : {}),
        responses: normalizeResponses(rawOperation.responses),
        security: normalizeSecurity(rawOperation.security ?? document.security),
      });
    }
  }
  return operations;
}

function normalizeParameter(parameter: Record<string, unknown>): ParameterDefinition {
  return {
    name: String(parameter.name ?? ''),
    location: (parameter.in === 'formData' ? 'body' : String(parameter.in ?? 'query')) as ParameterDefinition['location'],
    required: Boolean(parameter.required),
    ...(parameter.schema !== undefined ? { schema: parameter.schema } : {}),
    ...(parameter.example !== undefined ? { example: parameter.example } : {}),
  };
}

function normalizeV2RequestBody(pathParameters: Record<string, unknown>[], operationParameters: Record<string, unknown>[], document: Record<string, unknown>): RequestBodyDefinition | undefined {
  const body = [...pathParameters, ...operationParameters].find((parameter) => parameter.in === 'body');
  if (body) return { required: Boolean(body.required), contentType: firstString(body.consumes, document.consumes, 'application/json'), schema: body.schema, example: body.xExample };
  const formData = [...pathParameters, ...operationParameters].filter((parameter) => parameter.in === 'formData');
  return formData.length ? { required: formData.some((parameter) => Boolean(parameter.required)), contentType: firstString(document.consumes, 'application/x-www-form-urlencoded') } : undefined;
}

function normalizeV3RequestBody(value: unknown): RequestBodyDefinition | undefined {
  if (!isRecord(value)) return undefined;
  const content = isRecord(value.content) ? value.content : {};
  const [contentType, mediaValue] = Object.entries(content)[0] ?? [];
  const media = isRecord(mediaValue) ? mediaValue : {};
  return { required: Boolean(value.required), contentType: contentType ?? 'application/json', schema: media.schema, example: media.example ?? media.examples };
}

function normalizeResponses(value: unknown): ResponseDefinition[] {
  if (!isRecord(value)) return [];
  return Object.entries(value).filter(([status]) => /^\d{3}$/.test(status)).map(([status, raw]) => {
    const response = isRecord(raw) ? raw : {};
    const content = isRecord(response.content) ? response.content : {};
    const [contentType, mediaValue] = Object.entries(content)[0] ?? [];
    const media = isRecord(mediaValue) ? mediaValue : {};
    return {
      status: Number(status),
      ...(response.description ? { description: String(response.description) } : {}),
      ...(contentType ? { contentType } : response.schema !== undefined ? { contentType: 'application/json' } : {}),
      ...(media.schema !== undefined ? { schema: media.schema } : response.schema !== undefined ? { schema: response.schema } : {}),
    };
  });
}

function normalizeSecurity(value: unknown): SecurityRequirement[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((requirement) => isRecord(requirement)
    ? Object.entries(requirement).map(([scheme, scopes]) => ({ scheme, scopes: asArray(scopes).map(String) }))
    : []);
}

function firstString(...values: unknown[]): string {
  return values.flatMap((value) => asArray(value).map(String))[0] ?? 'application/json';
}

function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function isRecord(value: unknown): value is Record<string, any> { return typeof value === 'object' && value !== null; }