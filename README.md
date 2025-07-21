# Tally MCP (Model Context Protocol) Server

A Model Context Protocol server implementation that provides integration with Tally ERP accounting software. This project creates MCP tools to interact with a Tally instance running on localhost:9000, enabling seamless access to accounting data and operations through natural language commands.

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

- Python 3.13 or higher
- Tally ERP running on localhost:9000
- UV package manager

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd tally-mcp
```

1. Install dependencies using UV:

```bash
uv sync
```

## Usage

### Starting the Server

Run the MCP server:

```bash
uv run server.py
```

### Basic Script

Run the basic main script:

```bash
uv run main.py
```

### Package Management

This project uses `uv` as the Python package manager. Common commands:

- Add dependencies: `uv add <package>`
- Remove dependencies: `uv remove <package>`
- Sync dependencies: `uv sync`

## Project Structure

- `server.py` - Main MCP server implementation with Tally integration
- `main.py` - Basic entry point
- `pyproject.toml` - Project configuration
- `tasks/` - Project tasks and todo lists

## Technical Details

### Integration Pattern

All Tally interactions follow this XML request/response pattern:

1. Construct XML ENVELOPE with HEADER/BODY structure
2. Send POST request to TALLY_URL (`http://localhost:9000`)
3. Parse XML response using ElementTree
4. Format and return human-readable results

### Dependencies

- `mcp[cli]` - MCP framework for tool server implementation
- `FastMCP` - Server framework from mcp.server.fastmcp
- `httpx` - Async HTTP client for Tally API calls
- `xml.etree.ElementTree` - XML parsing for Tally responses

## Development Notes

- Tally server must be running on localhost:9000 for tools to function
- Date formats expected: DD-MM-YYYY
- Error handling is basic - production use would need more robust XML parsing
- All MCP tools are async functions using httpx.AsyncClient

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license information here]
