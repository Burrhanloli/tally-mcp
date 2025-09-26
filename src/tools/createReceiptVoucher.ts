import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const createReceiptVoucherSchema = z.object({
	party: z
		.string()
		.describe("Party name from whom receipt is received (ledger name)."),
	amount: z.number().describe("Receipt amount."),
	date: z.string().describe("Date of receipt in DD-MM-YYYY format."),
	receiptMethod: z
		.string()
		.optional()
		.describe("Receipt method - 'Cash' or bank ledger name (default: 'Cash')."),
});

export function registerCreateReceiptVoucherTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient } = context;

	server.registerToolWithHandler(
		"createReceiptVoucher",
		"Creates a receipt voucher in Tally.",
		createReceiptVoucherSchema,
		async (args: {
			party: string;
			amount: number;
			date: string;
			receiptMethod?: string;
		}) => {
			const { party, amount, date, receiptMethod = "Cash" } = args;

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
                        <VOUCHER VCHTYPE="Receipt" ACTION="Create">
                            <DATE>${date}</DATE>
                            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
                            <PARTYLEDGERNAME>${party}</PARTYLEDGERNAME>
                            <NARRATION>Receipt from ${party}</NARRATION>
                             <ALLLEDGERENTRIES.LIST>
                                 <LEDGERNAME>${receiptMethod}</LEDGERNAME>
                                 <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                 <AMOUNT>${amount}</AMOUNT>
                             </ALLLEDGERENTRIES.LIST>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>${party}</LEDGERNAME>
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
					return `Receipt voucher created successfully:\nParty: ${party}\nAmount: ${amount}\nDate: ${date}\nReceipt Method: ${receiptMethod}`;
				}
				return `Failed to create receipt voucher. Response: ${responseText.slice(0, 200)}`;
			} catch (error: any) {
				return `Error creating receipt voucher: ${error.message}`;
			}
		}
	);
}
