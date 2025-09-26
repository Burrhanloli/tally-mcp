import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const createJournalVoucherSchema = z.object({
	debitLedger: z.string().describe("Ledger to be debited."),
	creditLedger: z.string().describe("Ledger to be credited."),
	amount: z.number().describe("Transaction amount."),
	date: z.string().describe("Date of transaction in DD-MM-YYYY format."),
	narration: z.string().describe("Description of the transaction."),
});

export function registerCreateJournalVoucherTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient } = context;

	server.registerToolWithHandler(
		"createJournalVoucher",
		"Creates a journal voucher in Tally for general entries.",
		createJournalVoucherSchema,
		async (args: {
			debitLedger: string;
			creditLedger: string;
			amount: number;
			date: string;
			narration: string;
		}) => {
			const { debitLedger, creditLedger, amount, date, narration } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Import Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <IMPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Vouchers</REPORTNAME>
                </REQUESTDESC>
                <REQUESTDATA>
                    <TALLYMESSAGE xmlns:UDF="TallyUDF">
                        <VOUCHER VCHTYPE="Journal" ACTION="Create">
                            <DATE>${date}</DATE>
                            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                            <NARRATION>${narration}</NARRATION>
                             <ALLLEDGERENTRIES.LIST>
                                 <LEDGERNAME>${debitLedger}</LEDGERNAME>
                                 <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                 <AMOUNT>${amount}</AMOUNT>
                             </ALLLEDGERENTRIES.LIST>
                             <ALLLEDGERENTRIES.LIST>
                                 <LEDGERNAME>${creditLedger}</LEDGERNAME>
                                 <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                 <AMOUNT>${-amount}</AMOUNT>
                             </ALLLEDGERENTRIES.LIST>
                        </VOUCHER>
                    </TALLYMESSAGE>
                </REQUESTDATA>
            </IMPORTDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const responseText = response.rawXml || "";

				if (responseText.toLowerCase().includes("created")) {
					return `Journal voucher created successfully:\nDebit: ${debitLedger} - ${amount}\nCredit: ${creditLedger} - ${amount}\nDate: ${date}\nNarration: ${narration}`;
				}
				return `Failed to create journal voucher. Response: ${responseText.slice(0, 200)}`;
			} catch (error: any) {
				return `Error creating journal voucher: ${error.message}`;
			}
		}
	);
}
