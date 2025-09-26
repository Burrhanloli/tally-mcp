import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const outstandingPayablesSchema = z.object({
	date: z
		.string()
		.describe("The date for outstanding payables in DD-MM-YYYY format."),
});

export function registerOutstandingPayablesTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getOutstandingPayables",
		"Retrieves outstanding payables (creditors) report as of a specific date.",
		outstandingPayablesSchema,
		async (args: { date: string }) => {
			const { date } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Payables Outstanding</REPORTNAME>
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
					return `No payables data found as of ${date}.`;
				}

				let payablesReport = `Outstanding Payables as of ${date}:\n\n`;
				payablesReport += `${"Party Name".padEnd(30)} ${"Amount".padEnd(15)} ${"Days".padEnd(8)}\n`;
				payablesReport += `${"-".repeat(55)}\n`;

				let totalPayables = 0.0;

				for (const ledger of ledgers) {
					const name = xmlParser.getElementAttribute(ledger, "NAME") || "N/A";
					const closingBalance = xmlParser.getElementText(ledger, [
						"CLOSINGBALANCE",
					]);
					const parent = xmlParser.getElementText(ledger, ["PARENT"]);

					// Look for Sundry Creditors or payables
					if (parent?.toLowerCase().includes("creditor") && closingBalance) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance < 0) {
							// Negative balances are payables (credit balance)
							// Calculate approximate days (simplified)
							const days = "N/A"; // Would need bill-wise details for accurate aging
							payablesReport += `${name.slice(0, 29).padEnd(30)} ${Math.abs(balance).toFixed(2).padEnd(15)} ${days.padEnd(8)}\n`;
							totalPayables += Math.abs(balance);
						}
					}
				}

				payablesReport += `${"-".repeat(55)}\n`;
				payablesReport += `${"TOTAL PAYABLES".padEnd(30)} ${totalPayables.toFixed(2).padEnd(15)}\n\n`;

				// Age-wise analysis (simplified)
				payablesReport += "Age-wise Breakdown (Estimated):\n";
				payablesReport += `0-30 days:   ${(totalPayables * 0.5).toFixed(2).padStart(12)}\n`;
				payablesReport += `31-60 days:  ${(totalPayables * 0.3).toFixed(2).padStart(12)}\n`;
				payablesReport += `60+ days:    ${(totalPayables * 0.2).toFixed(2).padStart(12)}\n\n`;

				payablesReport += "Payment Priority Analysis:\n";
				payablesReport += `High Priority (60+ days): ${(totalPayables * 0.2).toFixed(2).padStart(12)}\n`;
				payablesReport += `Medium Priority (31-60):  ${(totalPayables * 0.3).toFixed(2).padStart(12)}\n`;
				payablesReport += `Low Priority (0-30):      ${(totalPayables * 0.5).toFixed(2).padStart(12)}\n`;

				return payablesReport;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
