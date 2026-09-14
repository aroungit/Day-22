import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface AxiosClient {
  request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
}

export class DefaultAxiosClient implements AxiosClient {
  constructor(private readonly maxRetries = 2) {}

  async request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const retries = config.method && !['get', 'head', 'options', 'put', 'delete'].includes(config.method.toLowerCase())
      ? 0
      : this.maxRetries;
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await axios.request<T>(config);
      } catch (error) {
        if (attempt >= retries || !isRetryable(error)) throw error;
      }
    }
  }
}

function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { response?: { status?: number }; code?: string };
  const status = candidate.response?.status ?? 0;
  return !candidate.response || status === 408 || status === 429 || status >= 500 || candidate.code === 'ECONNABORTED';
}