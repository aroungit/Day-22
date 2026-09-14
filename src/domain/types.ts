export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie' | 'body';

export interface ParameterDefinition {
  name: string;
  location: ParameterLocation;
  required: boolean;
  schema?: unknown;
  example?: unknown;
}

export interface RequestBodyDefinition {
  required: boolean;
  contentType: string;
  schema?: unknown;
  example?: unknown;
}

export interface ResponseDefinition {
  status: number;
  description?: string;
  contentType?: string;
  schema?: unknown;
}

export interface SecurityRequirement {
  scheme: string;
  scopes: string[];
}

export interface ServerDefinition {
  url: string;
  description?: string;
  variables?: Record<string, { default: string; enum?: string[] }>;
}

export type AuthConfig =
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }
  | { type: 'apiKey'; key: string; value: string; location: 'header' | 'query' };

export type PayloadStrategy = 'none' | 'example' | 'schema' | 'template' | 'custom';

export type TestType = 'happy-path' | 'validation-error' | 'authentication-error' | 'boundary';

export type RunStatus = 'planned' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TestResultStatus = 'passed' | 'failed' | 'skipped';