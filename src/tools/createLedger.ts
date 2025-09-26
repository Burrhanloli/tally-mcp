import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerCreateLedgerTool(
  server: TallyMcpServer,
  _context: ToolContext
): void {
  server.registerToolWithHandler(
    "create_ledger",
    "Creates a new ledger in Tally.",
    {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the ledger to create.",
        },
        group: {
          type: "string",
          description: "The group under which to create the ledger.",
        },
        opening_balance: {
          type: "number",
          description: "Opening balance for the ledger.",
          default: 0.0,
        },
      },
      required: ["name", "group"],
    },
    async (_args: any) => "TODO: Implement create_ledger tool"
  );
}
