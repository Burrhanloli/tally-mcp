import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const createPurchaseVoucherSchema = z.object({
	party: z.string().describe("Supplier name (ledger name)."),
	items: z.string().describe("Description of items purchased."),
	amount: z.number().describe("Total purchase amount."),
	date: z.string().describe("Date of purchase in DD-MM-YYYY format."),
});

export function registerCreatePurchaseVoucherTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient } = context;

	server.registerToolWithHandler(
		"createPurchaseVoucher",
		"Creates a purchase voucher in Tally.",
		createPurchaseVoucherSchema,
		async (args: {
			party: string;
			items: string;
			amount: number;
			date: string;
		}) => {
			const { party, items, amount, date } = args;

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
                        <VOUCHER VCHTYPE="Purchase" ACTION="Create">
                            <DATE>${date}</DATE>
                            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
                            <PARTYLEDGERNAME>${party}</PARTYLEDGERNAME>
                            <NARRATION>${items}</NARRATION>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>Purchase</LEDGERNAME>
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
					return `Purchase voucher created successfully:\nParty: ${party}\nAmount: ${amount}\nDate: ${date}\nItems: ${items}`;
				}
				return `Failed to create purchase voucher. Response: ${responseText.slice(0, 200)}`;
			} catch (error: any) {
				return `Error creating purchase voucher: ${error.message}`;
			}
		}
	);
}
