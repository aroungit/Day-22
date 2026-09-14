import type { PayloadTemplate } from '../../domain/models/PayloadTemplate';
import type { TestTemplateRepository } from '../../domain/repositories/TestTemplateRepository';

export class InMemoryTestTemplateRepository implements TestTemplateRepository {
  private readonly templates = new Map<string, PayloadTemplate>();

  async save(template: PayloadTemplate): Promise<PayloadTemplate> {
    this.templates.set(template.id, template);
    return template;
  }

  async findById(id: string): Promise<PayloadTemplate | undefined> {
    return this.templates.get(id);
  }

  async list(): Promise<PayloadTemplate[]> {
    return [...this.templates.values()];
  }

  async deleteById(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }
}