import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const createSalesVoucherSchema = z.object({
	party: z.string().describe("Customer name (ledger name)."),
	items: z.string().describe("Description of items sold."),
	amount: z.number().describe("Total sales amount."),
	date: z.string().describe("Date of sale in DD-MM-YYYY format."),
});

export function registerCreateSalesVoucherTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient } = context;

	server.registerToolWithHandler(
		"createSalesVoucher",
		"Creates a sales voucher in Tally.",
		createSalesVoucherSchema,
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
                        <VOUCHER VCHTYPE="Sales" ACTION="Create">
                            <DATE>${date}</DATE>
                            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                            <PARTYLEDGERNAME>${party}</PARTYLEDGERNAME>
                            <NARRATION>${items}</NARRATION>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>${party}</LEDGERNAME>
                                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                <AMOUNT>${amount}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>Sales</LEDGERNAME>
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
					return `Sales voucher created successfully:\nParty: ${party}\nAmount: ${amount}\nDate: ${date}\nItems: ${items}`;
				}
				return `Failed to create sales voucher. Response: ${responseText.slice(0, 200)}`;
			} catch (error: any) {
				return `Error creating sales voucher: ${error.message}`;
			}
		}
	);
}
