import type { NormalizedSpec } from '../../domain/models/NormalizedSpec';
import type { SpecRepository } from '../../domain/repositories/SpecRepository';
import { DefaultOpenApiNormalizer, type OpenApiNormalizer } from '../../infrastructure/swagger/OpenApiNormalizer';
import { DefaultSwaggerLoader, type SwaggerLoader, type SwaggerSource } from '../../infrastructure/swagger/SwaggerLoader';
import { DefaultSwaggerParserAdapter, type SwaggerParserAdapter } from '../../infrastructure/swagger/SwaggerParserAdapter';

export class IngestSwaggerUseCase {
  constructor(
    private readonly specs: SpecRepository,
    private readonly loader: SwaggerLoader = new DefaultSwaggerLoader(),
    private readonly parser: SwaggerParserAdapter = new DefaultSwaggerParserAdapter(),
    private readonly normalizer: OpenApiNormalizer = new DefaultOpenApiNormalizer(),
  ) {}

  async importDocument(document: unknown): Promise<NormalizedSpec> {
    const parsed = await this.parser.validate(document);
    const normalized = this.normalizer.normalize(parsed);
    return this.specs.save(normalized);
  }

  async importSource(source: SwaggerSource): Promise<NormalizedSpec> {
    return this.importDocument(await this.loader.load(source));
  }

  async validate(document: unknown): Promise<{ valid: true }> {
    await this.parser.validate(document);
    return { valid: true };
  }
}