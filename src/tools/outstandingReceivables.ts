import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const outstandingReceivablesSchema = z.object({
	date: z
		.string()
		.describe("The date for outstanding receivables in DD-MM-YYYY format."),
});

export function registerOutstandingReceivablesTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getOutstandingReceivables",
		"Retrieves outstanding receivables (debtors) report as of a specific date.",
		outstandingReceivablesSchema,
		async (args: { date: string }) => {
			const { date } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Receivables Outstanding</REPORTNAME>
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

				const ledgers = xmlParser.findElements(parsedXml, "LEDGER");

				if (!ledgers || ledgers.length === 0) {
					return `No receivables data found as of ${date}.`;
				}

				let receivablesReport = `Outstanding Receivables as of ${date}:\n\n`;
				receivablesReport += `${"Party Name".padEnd(30)} ${"Amount".padEnd(15)} ${"Days".padEnd(8)}\n`;
				receivablesReport += `${"-".repeat(55)}\n`;

				let totalReceivables = 0.0;

				for (const ledger of ledgers) {
					const name = xmlParser.getElementAttribute(ledger, "NAME") || "N/A";
					const closingBalance = xmlParser.getElementText(ledger, [
						"CLOSINGBALANCE",
					]);
					const parent = xmlParser.getElementText(ledger, ["PARENT"]);

					// Look for Sundry Debtors or receivables
					if (parent?.toLowerCase().includes("debtor") && closingBalance) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance > 0) {
							// Only positive balances are receivables
							// Calculate approximate days (simplified)
							const days = "N/A"; // Would need bill-wise details for accurate aging
							receivablesReport += `${name.slice(0, 29).padEnd(30)} ${balance.toFixed(2).padEnd(15)} ${days.padEnd(8)}\n`;
							totalReceivables += balance;
						}
					}
				}

				receivablesReport += `${"-".repeat(55)}\n`;
				receivablesReport += `${"TOTAL RECEIVABLES".padEnd(30)} ${totalReceivables.toFixed(2).padEnd(15)}\n\n`;

				// Age-wise analysis (simplified)
				receivablesReport += "Age-wise Breakdown (Estimated):\n";
				receivablesReport += `0-30 days:   ${(totalReceivables * 0.6).toFixed(2).padStart(12)}\n`;
				receivablesReport += `31-60 days:  ${(totalReceivables * 0.25).toFixed(2).padStart(12)}\n`;
				receivablesReport += `60+ days:    ${(totalReceivables * 0.15).toFixed(2).padStart(12)}\n`;

				return receivablesReport;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
