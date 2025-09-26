import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const ageAnalysisSchema = z.object({
	ledgerName: z.string().describe("Name of the ledger for aging analysis."),
	date: z.string().describe("Date for analysis in DD-MM-YYYY format."),
});

export function registerAgeAnalysisTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getAgeAnalysis",
		"Retrieves aging analysis for a specific ledger (receivables/payables analysis).",
		ageAnalysisSchema,
		async (args: { ledgerName: string; date: string }) => {
			// Validate input with Zod
			const validatedArgs = ageAnalysisSchema.parse(args);
			const { ledgerName, date } = validatedArgs;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Age Analysis</REPORTNAME>
                    <STATICVARIABLES>
                        <LEDGERNAME>${ledgerName}</LEDGERNAME>
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

				const bills =
					xmlParser.findElements(parsedXml, "BILL") ||
					xmlParser.findElements(parsedXml, "VOUCHER");

				if (!bills || bills.length === 0) {
					return `No bills/transactions found for '${ledgerName}' as of ${date}.`;
				}

				let ageAnalysis = `Age Analysis - ${ledgerName} as of ${date}:\n\n`;

				// Age buckets
				let current = 0.0; // 0-30 days
				let thirtyToSixty = 0.0; // 31-60 days
				let sixtyToNinety = 0.0; // 61-90 days
				let ninetyPlus = 0.0; // 90+ days

				ageAnalysis += "OUTSTANDING DETAILS:\n";
				ageAnalysis += `${"-".repeat(70)}\n`;
				ageAnalysis += `${"Bill Date".padEnd(12)} ${"Bill No".padEnd(12)} ${"Amount".padEnd(12)} ${"Days".padEnd(8)} ${"Age Group".padEnd(15)}\n`;
				ageAnalysis += `${"-".repeat(70)}\n`;

				// Parse date for age calculation
				const analysisDate = new Date(date.split("-").reverse().join("-"));
				let totalOutstanding = 0.0;

				for (const bill of bills) {
					const billDateElem =
						xmlParser.getElementText(bill, ["BILLDATE"]) ||
						xmlParser.getElementText(bill, ["DATE"]);
					const billNoElem =
						xmlParser.getElementText(bill, ["BILLNUMBER"]) ||
						xmlParser.getElementText(bill, ["VOUCHERNUMBER"]);
					const amountElem =
						xmlParser.getElementText(bill, ["AMOUNT"]) ||
						xmlParser.getElementText(bill, ["CLOSINGBALANCE"]);

					if (amountElem) {
						const amount = Number.parseFloat(amountElem) || 0.0;
						const billNo = billNoElem || "N/A";

						// Calculate days
						let daysOld = 0;
						let billDateStr = "N/A";
						if (billDateElem) {
							try {
								const billDate = new Date(
									billDateElem.slice(0, 10).split("-").reverse().join("-")
								);
								daysOld = Math.floor(
									(analysisDate.getTime() - billDate.getTime()) /
										(1000 * 60 * 60 * 24)
								);
								billDateStr = billDateElem.slice(0, 10);
							} catch {
								daysOld = 0;
							}
						}

						// Determine age group
						let ageGroup = "";
						if (daysOld <= 30) {
							ageGroup = "0-30 days";
							current += Math.abs(amount);
						} else if (daysOld <= 60) {
							ageGroup = "31-60 days";
							thirtyToSixty += Math.abs(amount);
						} else if (daysOld <= 90) {
							ageGroup = "61-90 days";
							sixtyToNinety += Math.abs(amount);
						} else {
							ageGroup = "90+ days";
							ninetyPlus += Math.abs(amount);
						}

						totalOutstanding += Math.abs(amount);

						if (Math.abs(amount) > 0) {
							ageAnalysis += `${billDateStr.padEnd(12)} ${billNo.padEnd(12)} ${Math.abs(amount).toFixed(2).padEnd(12)} ${daysOld.toString().padEnd(8)} ${ageGroup.padEnd(15)}\n`;
						}
					}
				}

				ageAnalysis += `${"-".repeat(70)}\n`;
				ageAnalysis += `${"TOTAL OUTSTANDING".padEnd(24)} ${totalOutstanding.toFixed(2).padEnd(12)}\n\n`;

				// Age Summary
				ageAnalysis += "AGE SUMMARY:\n";
				ageAnalysis += `${"=".repeat(50)}\n`;
				ageAnalysis += `${"Age Group".padEnd(15)} ${"Amount".padEnd(12)} ${"%".padEnd(8)} ${"Risk Level".padEnd(12)}\n`;
				ageAnalysis += `${"-".repeat(50)}\n`;

				if (totalOutstanding > 0) {
					const currentPct = (current / totalOutstanding) * 100;
					const thirtySixtyPct = (thirtyToSixty / totalOutstanding) * 100;
					const sixtyNinetyPct = (sixtyToNinety / totalOutstanding) * 100;
					const ninetyPlusPct = (ninetyPlus / totalOutstanding) * 100;

					ageAnalysis += `${"0-30 days".padEnd(15)} ${current.toFixed(2).padEnd(12)} ${currentPct.toFixed(1).padEnd(8)} ${"Low".padEnd(12)}\n`;
					ageAnalysis += `${"31-60 days".padEnd(15)} ${thirtyToSixty.toFixed(2).padEnd(12)} ${thirtySixtyPct.toFixed(1).padEnd(8)} ${"Medium".padEnd(12)}\n`;
					ageAnalysis += `${"61-90 days".padEnd(15)} ${sixtyToNinety.toFixed(2).padEnd(12)} ${sixtyNinetyPct.toFixed(1).padEnd(8)} ${"High".padEnd(12)}\n`;
					ageAnalysis += `${"90+ days".padEnd(15)} ${ninetyPlus.toFixed(2).padEnd(12)} ${ninetyPlusPct.toFixed(1).padEnd(8)} ${"Critical".padEnd(12)}\n`;
				}

				ageAnalysis += `${"-".repeat(50)}\n`;
				ageAnalysis += `${"TOTAL".padEnd(15)} ${totalOutstanding.toFixed(2).padEnd(12)} ${"100.0".padEnd(8)}\n\n`;

				// Risk Assessment
				const criticalPercentage = (ninetyPlus / totalOutstanding) * 100 || 0;
				if (criticalPercentage > 20) {
					ageAnalysis += "⚠️  HIGH RISK: 90+ days outstanding exceeds 20%\n";
				} else if (criticalPercentage > 10) {
					ageAnalysis += "⚡ MEDIUM RISK: Monitor 90+ days outstanding\n";
				} else {
					ageAnalysis += "✅ LOW RISK: Healthy aging profile\n";
				}

				return ageAnalysis;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
