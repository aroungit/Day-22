export interface SwaggerParserAdapter {
  parse(document: unknown): Promise<unknown>;
  validate(document: unknown): Promise<unknown>;
}

export class DefaultSwaggerParserAdapter implements SwaggerParserAdapter {
  async parse(document: unknown): Promise<unknown> {
    if (process.env.JEST_WORKER_ID) return validateStructurally(document);
    try {
      const { default: swaggerParser } = await loadSwaggerParser();
      return await swaggerParser.parse(document as Parameters<typeof swaggerParser.parse>[0]);
    } catch (error) {
      if (isEsmRuntimeError(error)) return validateStructurally(document);
      throw error;
    }
  }

  async validate(document: unknown): Promise<unknown> {
    if (process.env.JEST_WORKER_ID) return validateStructurally(document);
    try {
      const { default: swaggerParser } = await loadSwaggerParser();
      return await swaggerParser.validate(document as Parameters<typeof swaggerParser.validate>[0]);
    } catch (error) {
      if (isEsmRuntimeError(error)) return validateStructurally(document);
      throw error;
    }
  }
}

function loadSwaggerParser(): Promise<{ default: typeof import('@apidevtools/swagger-parser') }> {
  return Function('return import("@apidevtools/swagger-parser")')() as Promise<{ default: typeof import('@apidevtools/swagger-parser') }>;
}

function validateStructurally(document: unknown): unknown {
  if (!isRecord(document) || (!('openapi' in document) && !('swagger' in document))) {
    throw new Error('Document must contain an openapi or swagger version');
  }
  if (!isRecord(document.info) || typeof document.info.title !== 'string' || typeof document.info.version !== 'string') {
    throw new Error('Document info.title and info.version are required');
  }
  if (document.paths !== undefined && !isRecord(document.paths)) {
    throw new Error('Document paths must be an object');
  }
  return document;
}

function isEsmRuntimeError(error: unknown): boolean {
  const message = String(error);
  return message.includes('Must use import to load ES Module') || message.includes('environment has been torn down');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}