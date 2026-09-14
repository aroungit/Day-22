import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

export interface HealthResponse { status: string; service: string; environment: string; }
export interface Operation { operationId: string; method: string; path: string; summary?: string; tags: string[]; }
export interface NormalizedSpec { id: string; title: string; version: string; operations: Operation[]; servers: Array<{ url: string }>; importedAt?: string; }
export interface EnvironmentConfig { id?: string; specId?: string; name: string; baseUrl: string; headers: Record<string, string>; auth?: { type: string; credentials?: Record<string, string> }; timeoutMs?: number; }
export interface RunReport { runId: string; specId: string; environmentName: string; framework?: 'axios' | 'playwright'; status: 'running' | 'passed' | 'failed' | 'cancelled'; startedAt: string; completedAt?: string; summary: { total: number; passed: number; failed: number; skipped: number }; results: Array<{ testCaseId: string; operationId: string; status: string; expectedStatus: number; actualStatus?: number; durationMs?: number; error?: string }>; }
export interface RunPlan { runId: string; specId: string; envName: string; operations: Operation[]; testCaseDefinitions: Array<{ id: string; operationId: string; name: string; testType: string; expectedStatus: number }>; status?: string; createdAt?: string; }
export interface RunAggregate { byTag: Array<{ key: string; total: number; passed: number; failed: number }>; byMethod: Array<{ key: string; total: number; passed: number; failed: number }>; byPath: Array<{ key: string; total: number; passed: number; failed: number }>; }
export interface RunPage { items: RunReport[]; page: number; pageSize: number; total: number; pages: number; }
export interface GeneratedTests { specId: string; code: string; metadata: { operationIds: string[]; testCaseCount: number; options: Record<string, unknown> }; }

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const baseURL = configuredBaseUrl ? (configuredBaseUrl.endsWith('/api') ? configuredBaseUrl : `${configuredBaseUrl}/api`) : '/api';
const client = axios.create({ baseURL, timeout: 30_000, headers: { 'Content-Type': 'application/json' } });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

client.interceptors.response.use(undefined, (error: AxiosError<{ error?: string | { message?: string } }>) => {
  const responseError = error.response?.data?.error;
  const message = typeof responseError === 'string' ? responseError : responseError?.message;
  if (error.response?.status === 401) localStorage.removeItem('auth_token');
  toast.error(message || (error.request ? 'Network error. Check the API connection.' : 'Unexpected API error.'));
  return Promise.reject(error);
});

export const api = {
  health: () => client.get<HealthResponse>('/health').then((response) => response.data),
  importSpec: (document: unknown) => client.post<NormalizedSpec>('/spec/import', { document }).then((response) => response.data),
  importSpecUrl: (url: string) => client.post<NormalizedSpec>('/spec/import', { source: { type: 'url', url } }).then((response) => response.data),
  getSpec: (id: string) => client.get<NormalizedSpec>(`/spec/${id}`).then((response) => response.data),
  getOperations: (id: string) => client.get<Operation[]>(`/spec/${id}/operations`).then((response) => response.data),
  getTags: (id: string) => client.get<string[]>(`/spec/${id}/tags`).then((response) => response.data),
  createEnvironment: (data: EnvironmentConfig) => client.post<EnvironmentConfig>('/environment', data).then((response) => response.data),
  listEnvironments: (specId: string) => client.get<EnvironmentConfig[]>(`/spec/${specId}/environments`).then((response) => response.data),
  updateEnvironment: (id: string, data: Partial<EnvironmentConfig>) => client.put<EnvironmentConfig>(`/environment/${id}`, data).then((response) => response.data),
  deleteEnvironment: (id: string) => client.delete(`/environment/${id}`),
  createPlan: (data: unknown) => client.post<RunPlan>('/execution/plan', data).then((response) => response.data),
  executeRun: (data: unknown) => client.post<RunReport>('/execution/run', data).then((response) => response.data),
  getRunStatus: (id: string) => client.get<RunReport>(`/execution/status/${id}`).then((response) => response.data),
  listRuns: (page: number, pageSize: number) => client.get<RunPage>('/execution/runs', { params: { page, pageSize } }).then((response) => response.data),
  retryFailed: (runId: string) => client.post<RunReport>('/execution/retry-failed', { runId }).then((response) => response.data),
  getAggregate: (runId: string) => client.get<RunAggregate>(`/execution/aggregate/${runId}`).then((response) => response.data),
  generateTests: (data: unknown) => client.post<GeneratedTests>('/testgen/generate-axios-tests', data).then((response) => response.data),
  generatePlaywrightTests: (data: unknown) => client.post<GeneratedTests>('/testgen/generate-playwright-tests', data).then((response) => response.data),
  buildPayload: (data: unknown) => client.post('/llm/build-payload', data).then((response) => response.data),
};