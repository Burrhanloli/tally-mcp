# GEMINI.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tally MCP (Model Context Protocol) server that provides integration with Tally ERP accounting software. The project creates MCP tools to interact with a Tally instance running on localhost:9000, allowing retrieval of daybooks, ledger vouchers, and ledger lists through XML-based requests.

## implementation Guidelines

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.

## Security prompt

Please check through all the code you just wrote and make sure it follows security best practices. make sure there are no sensitive information in the front and and there are no vulnerabilities that can be exploited

## Learning from Claude prompt

Please explain the functionality and code you just built out in detail. Walk me through what you changed and how it works. Act like you’re a senior engineer teaching me code

## Commands

### Development Environment

- **Install dependencies**: `uv sync` or `uv install`
- **Run the MCP server**: `uv run server.py`
- **Run basic main script**: `uv run main.py`

### Package Management

This project uses `uv` as the Python package manager (not pip). All dependency management should be done through uv commands:

- `uv add <package>` - Add new dependencies
- `uv remove <package>` - Remove dependencies
- `uv sync` - Sync dependencies with lockfile

## Architecture

### Core Files

- **server.py**: Main MCP server implementation using FastMCP framework
- **main.py**: Basic entry point (currently just prints hello message)
- **pyproject.toml**: Project configuration with uv workspace setup

### Tally Integration Pattern

All Tally interactions follow this XML request/response pattern:

- Construct XML ENVELOPE with HEADER/BODY structure
- Send POST request to TALLY_URL (<http://localhost:9000>)
- Parse XML response using ElementTree
- Format and return human-readable results

### Dependencies

- **mcp[cli]**: MCP framework for tool server implementation
- **FastMCP**: Server framework from mcp.server.fastmcp
- **httpx**: Async HTTP client for Tally API calls
- **xml.etree.ElementTree**: XML parsing for Tally responses

## Development Notes

- Tally server must be running on localhost:9000 for tools to function
- Date formats expected: DD-MM-YYYY
- Error handling is basic - production use would need more robust XML parsing
- All MCP tools are async functions using httpx.AsyncClient
- The project includes a workspace member "mcp-server-demo" that doesn't exist yet
