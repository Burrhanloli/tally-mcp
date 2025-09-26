import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const getVoucherDetailsSchema = z.object({
	voucherNumber: z.string().describe("The voucher number to retrieve."),
	voucherType: z
		.string()
		.describe(
			"The voucher type (e.g., 'Sales', 'Purchase', 'Payment', 'Receipt', 'Journal')."
		),
});

export function registerGetVoucherDetailsTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getVoucherDetails",
		"Retrieves details of a specific voucher from Tally.",
		getVoucherDetailsSchema,
		async (args: { voucherNumber: string; voucherType: string }) => {
			const { voucherNumber, voucherType } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Voucher Register</REPORTNAME>
                    <STATICVARIABLES>
                        <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const parsedXml = xmlParser.parse(response.rawXml || "");

				const vouchers = xmlParser.findElements(parsedXml, "VOUCHER");

				if (!vouchers || vouchers.length === 0) {
					return `No voucher found with number '${voucherNumber}' of type '${voucherType}'.`;
				}

				let voucherDetails = `Voucher Details - ${voucherType} #${voucherNumber}:\n\n`;

				for (const voucher of vouchers) {
					const date = xmlParser.getElementText(voucher, ["DATE"]);
					const party = xmlParser.getElementText(voucher, ["PARTYLEDGERNAME"]);
					const narration = xmlParser.getElementText(voucher, ["NARRATION"]);
					const amount = xmlParser.getElementText(voucher, ["AMOUNT"]);

					voucherDetails += `Date: ${date || "N/A"}\n`;
					voucherDetails += `Party: ${party || "N/A"}\n`;
					voucherDetails += `Amount: ${amount || "N/A"}\n`;
					voucherDetails += `Narration: ${narration || "N/A"}\n\n`;

					// Ledger entries
					const ledgerEntries = xmlParser.findElements(
						voucher,
						"ALLLEDGERENTRIES.LIST"
					);
					if (ledgerEntries && ledgerEntries.length > 0) {
						voucherDetails += "Ledger Entries:\n";
						voucherDetails += `${"Ledger".padEnd(25)} ${"Debit".padEnd(12)} ${"Credit".padEnd(12)}\n`;
						voucherDetails += `${"-".repeat(50)}\n`;

						for (const entry of ledgerEntries) {
							const ledgerName = xmlParser.getElementText(entry, [
								"LEDGERNAME",
							]);
							const entryAmount = xmlParser.getElementText(entry, ["AMOUNT"]);
							const isPositive = xmlParser.getElementText(entry, [
								"ISDEEMEDPOSITIVE",
							]);

							if (ledgerName && entryAmount) {
								const ledger = ledgerName.slice(0, 24);
								const amt = Number.parseFloat(entryAmount) || 0.0;

								if (isPositive === "Yes") {
									voucherDetails += `${ledger.padEnd(25)} ${amt.toFixed(2).padEnd(12)} ${"".padEnd(12)}\n`;
								} else {
									voucherDetails += `${ledger.padEnd(25)} ${"".padEnd(12)} ${Math.abs(amt).toFixed(2).padEnd(12)}\n`;
								}
							}
						}
					}
				}

				return voucherDetails;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
