import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const cashFlowSchema = z.object({
	fromDate: z.string().describe("The start date in DD-MM-YYYY format."),
	toDate: z.string().describe("The end date in DD-MM-YYYY format."),
});

export function registerCashFlowTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getCashFlow",
		"Retrieves Cash Flow statement from Tally for a specified date range.",
		cashFlowSchema,
		async (args: { fromDate: string; toDate: string }) => {
			const { fromDate, toDate } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Cash Flow</REPORTNAME>
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

				const ledgers = xmlParser.findElements(parsedXml, "LEDGER");

				if (!ledgers || ledgers.length === 0) {
					return `No cash flow data found for period ${fromDate} to ${toDate}.`;
				}

				let cashFlow = `Cash Flow Statement from ${fromDate} to ${toDate}:\n\n`;

				// Operating activities
				cashFlow += "CASH FLOWS FROM OPERATING ACTIVITIES:\n";
				cashFlow += `${"-".repeat(50)}\n`;
				let operatingTotal = 0.0;

				for (const ledger of ledgers) {
					const name = xmlParser.getElementAttribute(ledger, "NAME") || "";
					const closingBalance = xmlParser.getElementText(ledger, [
						"CLOSINGBALANCE",
					]);
					if (
						closingBalance &&
						["sales", "purchase", "expense", "income"].some((word) =>
							name.toLowerCase().includes(word)
						)
					) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance !== 0) {
							cashFlow += `${name.padEnd(35)} ${balance.toFixed(2).padStart(10)}\n`;
							operatingTotal += balance;
						}
					}
				}

				cashFlow += `${"Net Cash from Operating Activities".padEnd(35)} ${operatingTotal.toFixed(2).padStart(10)}\n\n`;

				// Investing activities
				cashFlow += "CASH FLOWS FROM INVESTING ACTIVITIES:\n";
				cashFlow += `${"-".repeat(50)}\n`;
				let investingTotal = 0.0;

				for (const ledger of ledgers) {
					const name = xmlParser.getElementAttribute(ledger, "NAME") || "";
					const closingBalance = xmlParser.getElementText(ledger, [
						"CLOSINGBALANCE",
					]);
					if (
						closingBalance &&
						["investment", "asset", "equipment"].some((word) =>
							name.toLowerCase().includes(word)
						)
					) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance !== 0) {
							cashFlow += `${name.padEnd(35)} ${balance.toFixed(2).padStart(10)}\n`;
							investingTotal += balance;
						}
					}
				}

				cashFlow += `${"Net Cash from Investing Activities".padEnd(35)} ${investingTotal.toFixed(2).padStart(10)}\n\n`;

				// Financing activities
				cashFlow += "CASH FLOWS FROM FINANCING ACTIVITIES:\n";
				cashFlow += `${"-".repeat(50)}\n`;
				let financingTotal = 0.0;

				for (const ledger of ledgers) {
					const name = xmlParser.getElementAttribute(ledger, "NAME") || "";
					const closingBalance = xmlParser.getElementText(ledger, [
						"CLOSINGBALANCE",
					]);
					if (
						closingBalance &&
						["loan", "capital", "dividend"].some((word) =>
							name.toLowerCase().includes(word)
						)
					) {
						const balance = Number.parseFloat(closingBalance) || 0.0;
						if (balance !== 0) {
							cashFlow += `${name.padEnd(35)} ${balance.toFixed(2).padStart(10)}\n`;
							financingTotal += balance;
						}
					}
				}

				cashFlow += `${"Net Cash from Financing Activities".padEnd(35)} ${financingTotal.toFixed(2).padStart(10)}\n\n`;

				// Net change in cash
				const netChange = operatingTotal + investingTotal + financingTotal;
				cashFlow += `${"=".repeat(50)}\n`;
				cashFlow += `${"Net Change in Cash".padEnd(35)} ${netChange.toFixed(2).padStart(10)}\n`;

				return cashFlow;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
