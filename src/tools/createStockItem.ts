import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const createStockItemSchema = z.object({
	name: z.string().describe("The name of the stock item to create."),
	unit: z
		.string()
		.describe("Unit of measurement (e.g., 'Nos', 'Kgs', 'Ltrs')."),
	rate: z.number().optional().describe("Standard rate/price for the item."),
});

export function registerCreateStockItemTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient } = context;

	server.registerToolWithHandler(
		"createStockItem",
		"Creates a new stock item in Tally.",
		createStockItemSchema,
		async (args: { name: string; unit: string; rate?: number }) => {
			const { name, unit, rate = 0 } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Import Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <IMPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>All Masters</REPORTNAME>
                </REQUESTDESC>
                <REQUESTDATA>
                    <TALLYMESSAGE xmlns:UDF="TallyUDF">
                        <STOCKITEM NAME="${name}" ACTION="Create">
                            <NAME>${name}</NAME>
                            <BASEUNITS>${unit}</BASEUNITS>
                            <OPENINGBALANCE>0</OPENINGBALANCE>
                            <OPENINGVALUE>0</OPENINGVALUE>
                            <OPENINGRATE>${rate}</OPENINGRATE>
                        </STOCKITEM>
                    </TALLYMESSAGE>
                </REQUESTDATA>
            </IMPORTDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const responseText = response.rawXml || "";

				if (
					responseText.toLowerCase().includes("created") ||
					responseText.toLowerCase().includes("success") ||
					responseText.toLowerCase().includes("accepted")
				) {
					return `Stock item created successfully:\nName: ${name}\nUnit: ${unit}\nRate: ${rate}`;
				}
				return `Failed to create stock item. Response: ${responseText.slice(0, 200)}`;
			} catch (error: any) {
				return `Error creating stock item: ${error.message}`;
			}
		}
	);
}
