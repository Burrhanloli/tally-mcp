import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const dayBookSchema = z.object({
	date: z.string().describe("The date for the daybook in DD-MM-YYYY format."),
});

export function registerDayBookTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getDayBook",
		"Retrieves the daybook from Tally for a specific date.",
		dayBookSchema,
		async (args: { date: string }) => {
			const { date } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>DayBook</REPORTNAME>
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

				const vouchers = xmlParser.findElements(parsedXml, "VOUCHER");
				if (!vouchers || vouchers.length === 0) {
					return "No entries found in the daybook for this date.";
				}

				let daybookReport = `Daybook for ${date}:\n\n`;
				for (const voucher of vouchers) {
					const voucherType = xmlParser.getElementText(voucher, [
						"VOUCHERTYPENAME",
					]);
					const voucherNumber = xmlParser.getElementText(voucher, [
						"VOUCHERNUMBER",
					]);
					const partyLedger = xmlParser.getElementText(voucher, [
						"PARTYLEDGERNAME",
					]);
					const amount = xmlParser.getElementText(voucher, ["AMOUNT"]);

					daybookReport += `- ${voucherType || "N/A"} (${voucherNumber || "N/A"}): ${partyLedger || "N/A"}, Amount: ${amount || "N/A"}\n`;
				}

				return daybookReport;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
