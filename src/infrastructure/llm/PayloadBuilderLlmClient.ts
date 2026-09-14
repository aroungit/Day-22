export interface PayloadBuilderLlmClient {
  buildPayload(schema: unknown, context?: string): Promise<unknown>;
}

export class UnconfiguredPayloadBuilderLlmClient implements PayloadBuilderLlmClient {
  async buildPayload(_schema: unknown, _context?: string): Promise<unknown> {
    throw new Error('Payload builder LLM client is not configured');
  }
}