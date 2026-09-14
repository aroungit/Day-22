import type {
  HttpMethod,
  ParameterDefinition,
  RequestBodyDefinition,
  ResponseDefinition,
  SecurityRequirement,
} from '../types';

export interface Operation {
  id: string;
  method: HttpMethod;
  path: string;
  tags: string[];
  summary?: string;
  description?: string;
  parameters: ParameterDefinition[];
  requestBody?: RequestBodyDefinition;
  responses: ResponseDefinition[];
  security?: SecurityRequirement[];
}