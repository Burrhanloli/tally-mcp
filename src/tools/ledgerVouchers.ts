import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const ledgerVouchersSchema = z.object({
	ledgerName: z.string().describe("The name of the ledger."),
	fromDate: z.string().describe("The start date in DD-MM-YYYY format."),
	toDate: z.string().describe("The end date in DD-MM-YYYY format."),
});

export function registerLedgerVouchersTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getLedgerVouchers",
		"Retrieves all vouchers for a specific ledger within a date range.",
		ledgerVouchersSchema,
		async (args: { ledgerName: string; fromDate: string; toDate: string }) => {
			const { ledgerName, fromDate, toDate } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Ledger Vouchers</REPORTNAME>
                    <STATICVARIABLES>
                        <LEDGERNAME>${ledgerName}</LEDGERNAME>
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

				const vouchers = xmlParser.findElements(parsedXml, "VOUCHER");
				if (!vouchers || vouchers.length === 0) {
					return `No vouchers found for ledger '${ledgerName}' in this period.`;
				}

				let ledgerReport = `Vouchers for ${ledgerName} from ${fromDate} to ${toDate}:\n\n`;
				for (const voucher of vouchers) {
					const voucherType = xmlParser.getElementText(voucher, [
						"VOUCHERTYPENAME",
					]);
					const voucherNumber = xmlParser.getElementText(voucher, [
						"VOUCHERNUMBER",
					]);
					const amount = xmlParser.getElementText(voucher, ["AMOUNT"]);

					ledgerReport += `- ${voucherType || "N/A"} (${voucherNumber || "N/A"}), Amount: ${amount || "N/A"}\n`;
				}

				return ledgerReport;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
