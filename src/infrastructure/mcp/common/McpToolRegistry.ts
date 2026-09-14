export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
  handler: (input: unknown) => Promise<unknown> | unknown;
}

export class McpToolRegistry {
  private readonly tools = new Map<string, McpTool>();

  register(tool: McpTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`MCP tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): McpTool | undefined {
    return this.tools.get(name);
  }

  list(): McpTool[] {
    return [...this.tools.values()];
  }
}