import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerCreateStockItemTool(
  server: TallyMcpServer,
  _context: ToolContext
): void {
  server.registerToolWithHandler(
    "create_stock_item",
    "Creates a new stock item in Tally.",
    {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the stock item to create.",
        },
        unit: {
          type: "string",
          description: "Unit of measurement (e.g., 'Nos', 'Kgs', 'Ltrs').",
        },
        rate: {
          type: "number",
          description: "Standard rate/price for the item.",
          default: 0.0,
        },
      },
      required: ["name", "unit"],
    },
    async (_args: any) => "TODO: Implement create_stock_item tool"
  );
}
