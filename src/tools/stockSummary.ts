import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const stockSummarySchema = z.object({
	date: z.string().describe("The date for stock summary in DD-MM-YYYY format."),
});

export function registerStockSummaryTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getStockSummary",
		"Retrieves stock summary/inventory valuation report as of a specific date.",
		stockSummarySchema,
		async (args: { date: string }) => {
			const { date } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Stock Summary</REPORTNAME>
                    <STATICVARIABLES>
                        <SVFROMDATE>${date}</SVFROMDATE>
                        <SVTODATE>${date}</SVTODATE>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const parsedXml = xmlParser.parse(response.rawXml || "");

				const stockItems = xmlParser.findElements(parsedXml, "STOCKITEM");

				if (!stockItems || stockItems.length === 0) {
					return `No stock data found as of ${date}.`;
				}

				let stockSummary = `Stock Summary as of ${date}:\n\n`;
				stockSummary += `${"Item Name".padEnd(25)} ${"Qty".padEnd(10)} ${"Rate".padEnd(10)} ${"Value".padEnd(12)}\n`;
				stockSummary += `${"-".repeat(60)}\n`;

				let totalValue = 0.0;

				for (const item of stockItems) {
					const name = xmlParser.getElementAttribute(item, "NAME") || "N/A";
					const closingBalance = xmlParser.getElementText(item, [
						"CLOSINGBALANCE",
					]);
					const closingRate = xmlParser.getElementText(item, ["CLOSINGRATE"]);
					const closingValue = xmlParser.getElementText(item, ["CLOSINGVALUE"]);

					const qty = closingBalance
						? Number.parseFloat(closingBalance) || 0.0
						: 0.0;
					const rate = closingRate
						? Number.parseFloat(closingRate) || 0.0
						: 0.0;
					const value = closingValue
						? Number.parseFloat(closingValue) || 0.0
						: 0.0;

					if (qty !== 0 || value !== 0) {
						stockSummary += `${name.slice(0, 24).padEnd(25)} ${qty.toFixed(2).padEnd(10)} ${rate.toFixed(2).padEnd(10)} ${value.toFixed(2).padEnd(12)}\n`;
						totalValue += value;
					}
				}

				stockSummary += `${"-".repeat(60)}\n`;
				stockSummary += `${"TOTAL STOCK VALUE".padEnd(25)} ${"".padEnd(10)} ${"".padEnd(10)} ${totalValue.toFixed(2).padEnd(12)}\n`;

				return stockSummary;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
