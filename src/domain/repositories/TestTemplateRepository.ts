import type { PayloadTemplate } from '../models/PayloadTemplate';

export interface TestTemplateRepository {
  save(template: PayloadTemplate): Promise<PayloadTemplate>;
  findById(id: string): Promise<PayloadTemplate | undefined>;
  list(): Promise<PayloadTemplate[]>;
  deleteById(id: string): Promise<boolean>;
}