import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerAllStockItemsTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_all_stock_items",
    "Retrieves a list of all stock items from Tally.",
    { type: "object", properties: {} },
    async (_args: any) => {
      const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Stock Items</REPORTNAME>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

      try {
        const response = await httpClient.post(xmlRequest);
        const parsedXml = xmlParser.parse(response.rawXml || "");

        const stockItems = xmlParser.findElements(parsedXml, "STOCKITEM");
        if (!stockItems || stockItems.length === 0) {
          return "No stock items found.";
        }

        let stockList = "List of all stock items:\n\n";
        for (const item of stockItems) {
          const itemName = xmlParser.getElementAttribute(item, "NAME");
          const baseUnits = xmlParser.getElementText(item, ["BASEUNITS"]);
          const unit = baseUnits || "N/A";
          stockList += `- ${itemName || "N/A"} (Unit: ${unit})\n`;
        }

        return stockList;
      } catch (error: any) {
        return `Error parsing Tally response: ${error.message}`;
      }
    }
  );
}
