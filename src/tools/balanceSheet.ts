import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const balanceSheetSchema = z.object({
	date: z.string().describe("The date for balance sheet in DD-MM-YYYY format."),
});

export function registerBalanceSheetTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getBalanceSheet",
		"Retrieves Balance Sheet from Tally as of a specific date.",
		balanceSheetSchema,
		async (args: { date: string }) => {
			const { date } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Balance Sheet</REPORTNAME>
                    <STATICVARIABLES>
                        <SVFROMDATE>01-04-2023</SVFROMDATE>
                        <SVTODATE>${date}</SVTODATE>
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
					return `No balance sheet data found as of ${date}.`;
				}

				let balanceSheet = `Balance Sheet as of ${date}:\n\n`;

				// Assets section
				balanceSheet += "ASSETS:\n";
				balanceSheet += `${"-".repeat(40)}\n`;
				let totalAssets = 0.0;

				const allItems = [...(groups || []), ...(ledgers || [])];
				for (const item of allItems) {
					const name = xmlParser.getElementAttribute(item, "NAME") || "";
					const closingBalance = xmlParser.getElementText(item, [
						"CLOSINGBALANCE",
					]);
					if (
						closingBalance &&
						["asset", "cash", "bank", "inventory", "stock"].some((word) =>
							name.toLowerCase().includes(word)
						)
					) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance !== 0) {
							balanceSheet += `${name.padEnd(30)} ${Math.abs(balance).toFixed(2).padStart(10)}\n`;
							totalAssets += Math.abs(balance);
						}
					}
				}

				balanceSheet += `${"Total Assets".padEnd(30)} ${totalAssets.toFixed(2).padStart(10)}\n\n`;

				// Liabilities section
				balanceSheet += "LIABILITIES:\n";
				balanceSheet += `${"-".repeat(40)}\n`;
				let totalLiabilities = 0.0;

				for (const item of allItems) {
					const name = xmlParser.getElementAttribute(item, "NAME") || "";
					const closingBalance = xmlParser.getElementText(item, [
						"CLOSINGBALANCE",
					]);
					if (
						closingBalance &&
						["liability", "payable", "loan", "capital"].some((word) =>
							name.toLowerCase().includes(word)
						)
					) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance !== 0) {
							balanceSheet += `${name.padEnd(30)} ${Math.abs(balance).toFixed(2).padStart(10)}\n`;
							totalLiabilities += Math.abs(balance);
						}
					}
				}

				balanceSheet += `${"Total Liabilities".padEnd(30)} ${totalLiabilities.toFixed(2).padStart(10)}\n\n`;

				// Balance check
				balanceSheet += `${"=".repeat(40)}\n`;
				const difference = totalAssets - totalLiabilities;
				if (Math.abs(difference) < 0.01) {
					// Allow for small rounding differences
					balanceSheet += "Balance Sheet is balanced ✓\n";
				} else {
					balanceSheet += `Difference: ${difference.toFixed(2).padStart(10)} (Balance sheet not balanced)\n`;
				}

				return balanceSheet;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
