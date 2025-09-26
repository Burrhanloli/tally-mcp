import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const profitLossSchema = z.object({
	fromDate: z.string().describe("The start date in DD-MM-YYYY format."),
	toDate: z.string().describe("The end date in DD-MM-YYYY format."),
});

export function registerProfitLossTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getProfitLoss",
		"Retrieves Profit & Loss statement from Tally for a specified date range.",
		profitLossSchema,
		async (args: { fromDate: string; toDate: string }) => {
			const { fromDate, toDate } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Profit and Loss A/c</REPORTNAME>
                    <STATICVARIABLES>
                        <SVFROMDATE>${fromDate}</SVFROMDATE>
                        <SVTODATE>${toDate}</SVTODATE>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const parsedXml = xmlParser.parse(response.rawXml || "");

				const groups = xmlParser.findElements(parsedXml, "GROUP");
				const ledgers = xmlParser.findElements(parsedXml, "LEDGER");

				if (
					(!groups || groups.length === 0) &&
					(!ledgers || ledgers.length === 0)
				) {
					return `No P&L data found for period ${fromDate} to ${toDate}.`;
				}

				let plStatement = `Profit & Loss Statement from ${fromDate} to ${toDate}:\n\n`;

				// Income section
				plStatement += "INCOME:\n";
				plStatement += `${"-".repeat(40)}\n`;
				let totalIncome = 0.0;

				const allItems = [...(groups || []), ...(ledgers || [])];
				for (const item of allItems) {
					const name = xmlParser.getElementAttribute(item, "NAME") || "";
					const closingBalance = xmlParser.getElementText(item, [
						"CLOSINGBALANCE",
					]);
					if (closingBalance && name.toLowerCase().includes("income")) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance !== 0) {
							plStatement += `${name.padEnd(30)} ${Math.abs(balance).toFixed(2).padStart(10)}\n`;
							totalIncome += Math.abs(balance);
						}
					}
				}

				plStatement += `${"Total Income".padEnd(30)} ${totalIncome.toFixed(2).padStart(10)}\n\n`;

				// Expenses section
				plStatement += "EXPENSES:\n";
				plStatement += `${"-".repeat(40)}\n`;
				let totalExpenses = 0.0;

				for (const item of allItems) {
					const name = xmlParser.getElementAttribute(item, "NAME") || "";
					const closingBalance = xmlParser.getElementText(item, [
						"CLOSINGBALANCE",
					]);
					if (
						closingBalance &&
						(name.toLowerCase().includes("expense") ||
							name.toLowerCase().includes("cost"))
					) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance !== 0) {
							plStatement += `${name.padEnd(30)} ${Math.abs(balance).toFixed(2).padStart(10)}\n`;
							totalExpenses += Math.abs(balance);
						}
					}
				}

				plStatement += `${"Total Expenses".padEnd(30)} ${totalExpenses.toFixed(2).padStart(10)}\n\n`;

				// Net result
				const netResult = totalIncome - totalExpenses;
				const resultType = netResult > 0 ? "Net Profit" : "Net Loss";
				plStatement += `${"=".repeat(40)}\n`;
				plStatement += `${resultType.padEnd(30)} ${Math.abs(netResult).toFixed(2).padStart(10)}\n`;

				return plStatement;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
