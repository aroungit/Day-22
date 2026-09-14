import { McpToolRegistry, type McpTool } from './McpToolRegistry';

export class McpServer {
  constructor(
    public readonly name: string,
    public readonly registry: McpToolRegistry = new McpToolRegistry(),
  ) {}

  listTools(): McpTool[] {
    return this.registry.list();
  }

  async callTool(name: string, input: unknown): Promise<unknown> {
    const tool = this.registry.get(name);
    if (!tool) {
      throw new Error(`MCP tool not found: ${name}`);
    }
    return tool.handler(input);
  }
}