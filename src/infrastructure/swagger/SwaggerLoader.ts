import { readFile } from 'node:fs/promises';

export type SwaggerSource =
  | { type: 'url'; url: string }
  | { type: 'file'; path: string }
  | { type: 'git'; repository: string; path: string; ref?: string };

export interface SwaggerLoader {
  loadFromUrl(url: string): Promise<unknown>;
  loadFromFile(path: string): Promise<unknown>;
  loadFromGit(repository: string, path: string, ref?: string): Promise<unknown>;
  load(source: SwaggerSource): Promise<unknown>;
}

export class DefaultSwaggerLoader implements SwaggerLoader {
  async loadFromUrl(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to load Swagger document: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const body = await response.text();
    return contentType.includes('json') ? JSON.parse(body) : body;
  }

  async loadFromFile(path: string): Promise<unknown> {
    const content = await readFile(path, 'utf8');
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  async loadFromGit(_repository: string, _path: string, _ref?: string): Promise<unknown> {
    throw new Error('Git Swagger loading is not implemented yet');
  }

  load(source: SwaggerSource): Promise<unknown> {
    switch (source.type) {
      case 'url':
        return this.loadFromUrl(source.url);
      case 'file':
        return this.loadFromFile(source.path);
      case 'git':
        return this.loadFromGit(source.repository, source.path, source.ref);
    }
  }
}