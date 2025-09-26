# Tally MCP Server - TypeScript/Bun Implementation

A Model Context Protocol (MCP) server that provides integration with Tally ERP accounting software. This TypeScript implementation uses Bun as the runtime and @modelcontextprotocol/sdk for MCP functionality, enabling seamless access to accounting data and operations through natural language commands.

## Features

### Financial Reports

- Day Book entries
- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- GST Reports
- Bank Reconciliation
- Budget vs Actual Analysis

### Account Management

- Ledger Creation and Listing
- Outstanding Receivables/Payables
- Age Analysis
- Stock Summary
- Audit Trail

### Transaction Management

- Create Sales Vouchers
- Create Purchase Vouchers
- Create Payment Vouchers
- Create Receipt Vouchers
- Create Journal Entries
- Voucher Details Retrieval

### Data Management

- Company Information Retrieval
- Company Backup
- Stock Item Management

## Prerequisites

- **Bun** runtime (recommended) or Node.js 18+
- **Tally ERP** running on localhost:9000
- **TypeScript** (included with Bun)

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd tally-mcp
```

2. Install dependencies using Bun:

```bash
bun install
```

3. Build the project:

```bash
bun run build
```

## Usage

### Development Mode

Run with hot reload for development:

```bash
bun run dev
```

### Package Management

This project uses `bun` as the package manager. Common commands:

- Add dependencies: `bun add <package>`
- Remove dependencies: `bun remove <package>`
- Install dependencies: `bun install`

## Project Structure

```
src/
├── index.ts          # Main entry point
├── server.ts         # MCP server implementation
├── types/            # TypeScript type definitions
├── utils/            # HTTP client and XML parser utilities
└── tools/            # MCP tool implementations
dist/                 # Compiled JavaScript output
```

## Technical Details

### Integration Pattern

All Tally interactions follow this XML request/response pattern:

1. Construct XML ENVELOPE with HEADER/BODY structure
2. Send POST request to TALLY_URL (`http://localhost:9000`)
3. Parse XML response using fast-xml-parser
4. Format and return human-readable results

### Dependencies

- `@modelcontextprotocol/sdk` - MCP framework for TypeScript
- `axios` - HTTP client for Tally API calls
- `fast-xml-parser` - XML parsing for Tally responses
- `typescript` - TypeScript compiler

### Migration from Python

This TypeScript implementation replaces the original Python version with:

- **Better Type Safety**: Full TypeScript types for all Tally API interactions
- **Modern Runtime**: Bun provides faster startup and execution
- **Improved Error Handling**: Better async error management
- **Modular Architecture**: Clean separation of concerns

**Key Changes:**

- FastMCP → @modelcontextprotocol/sdk
- httpx → axios
- xml.etree.ElementTree → fast-xml-parser
- Python async/await → TypeScript async/await

## Development Notes

- Tally server must be running on localhost:9000 for tools to function
- Date formats expected: DD-MM-YYYY
- Error handling includes proper TypeScript error types
- All MCP tools are async functions using axios
- XML parsing uses fast-xml-parser for better performance

### Environment Variables

```bash
# Tally server URL (default: http://localhost:9000)
TALLY_URL=http://localhost:9000

# Request timeout in milliseconds (default: 30000)
TALLY_TIMEOUT=30000
```

### Development Scripts

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Code formatting
bun run format

# Clean build
bun run clean
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license information here]
