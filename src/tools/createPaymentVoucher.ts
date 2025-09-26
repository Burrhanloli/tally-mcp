import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const createPaymentVoucherSchema = z.object({
	party: z
		.string()
		.describe("Party name to whom payment is made (ledger name)."),
	amount: z.number().describe("Payment amount."),
	date: z.string().describe("Date of payment in DD-MM-YYYY format."),
	paymentMethod: z
		.string()
		.optional()
		.describe("Payment method - 'Cash' or bank ledger name (default: 'Cash')."),
});

export function registerCreatePaymentVoucherTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient } = context;

	server.registerToolWithHandler(
		"createPaymentVoucher",
		"Creates a payment voucher in Tally.",
		createPaymentVoucherSchema,
		async (args: {
			party: string;
			amount: number;
			date: string;
			paymentMethod?: string;
		}) => {
			const { party, amount, date, paymentMethod = "Cash" } = args;

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
                        <VOUCHER VCHTYPE="Payment" ACTION="Create">
                            <DATE>${date}</DATE>
                            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
                            <PARTYLEDGERNAME>${party}</PARTYLEDGERNAME>
                            <NARRATION>Payment to ${party}</NARRATION>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>${party}</LEDGERNAME>
                                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                <AMOUNT>${amount}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>
                             <ALLLEDGERENTRIES.LIST>
                                 <LEDGERNAME>${paymentMethod}</LEDGERNAME>
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
					return `Payment voucher created successfully:\nParty: ${party}\nAmount: ${amount}\nDate: ${date}\nPayment Method: ${paymentMethod}`;
				}
				return `Failed to create payment voucher. Response: ${responseText.slice(0, 200)}`;
			} catch (error: any) {
				return `Error creating payment voucher: ${error.message}`;
			}
		}
	);
}
