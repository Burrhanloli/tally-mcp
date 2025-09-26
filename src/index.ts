#!/usr/bin/env bun
import { createTallyServer } from "./server.js";
import type { TallyConfig } from "./types/index.js";

// Load configuration from environment
const config: TallyConfig = {
	url: process.env.TALLY_URL || "http://localhost:9000",
	timeout: Number.parseInt(process.env.TALLY_TIMEOUT || "30000", 10),
};

// Create and start the MCP server
const server = createTallyServer(config);

async function main() {
	try {
		await server.start();
	} catch (_error) {
		process.exit(1);
	}
}

// Handle graceful shutdown
process.on("SIGINT", () => {
	process.exit(0);
});

process.on("SIGTERM", () => {
	process.exit(0);
});

// Start the server
main();
