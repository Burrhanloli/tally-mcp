import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
	type Tool,
} from "@modelcontextprotocol/sdk/types.js";
// Import all tools
import { registerAllTools } from "./tools/index.js";
import type { TallyConfig } from "./types/index.js";
import { createTallyClient, type TallyHttpClient } from "./utils/httpClient.js";
import { createXmlParser, type TallyXmlParser } from "./utils/xmlParser.js";

type ToolHandler = (
	args: any,
	context: { httpClient: TallyHttpClient; xmlParser: TallyXmlParser }
) => Promise<string>;

type ToolDefinition = {
	tool: Tool;
	handler: ToolHandler;
};

export class TallyMcpServer {
	private readonly server: Server;
	private readonly httpClient: TallyHttpClient;
	private readonly xmlParser: TallyXmlParser;
	private readonly tools: Map<string, ToolDefinition> = new Map();

	constructor(config: TallyConfig) {
		this.httpClient = createTallyClient(config);
		this.xmlParser = createXmlParser();

		this.server = new Server(
			{
				name: "tally-mcp-server",
				version: "1.0.0",
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.setupRequestHandlers();
		this.registerTools();
	}

	private setupRequestHandlers(): void {
		// List available tools
		this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: Array.from(this.tools.values()).map((def) => def.tool),
		}));

		// Handle tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			try {
				const toolDef = this.tools.get(name);
				if (!toolDef) {
					throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
				}

				// Execute the tool handler
				const result = await toolDef.handler(args || {}, {
					httpClient: this.httpClient,
					xmlParser: this.xmlParser,
				});

				return {
					content: [
						{
							type: "text",
							text: result,
						},
					],
				};
			} catch (error: any) {
				if (error instanceof McpError) {
					throw error;
				}

				return {
					content: [
						{
							type: "text",
							text: `Error: ${error.message || "Unknown error occurred"}`,
						},
					],
					isError: true,
				};
			}
		});
	}

	private registerTools(): void {
		registerAllTools(this, this.httpClient, this.xmlParser);
	}

	// Method to register a tool with its handler
	registerToolWithHandler(
		name: string,
		description: string,
		inputSchema: any,
		handler: ToolHandler
	): void {
		const tool: Tool = {
			name,
			description,
			inputSchema,
		};

		this.tools.set(name, { tool, handler });
	}

	async start(): Promise<void> {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
	}

	getHttpClient(): TallyHttpClient {
		return this.httpClient;
	}

	getXmlParser(): TallyXmlParser {
		return this.xmlParser;
	}
}

// Factory function for creating the server
export function createTallyServer(config: TallyConfig): TallyMcpServer {
	return new TallyMcpServer(config);
}
