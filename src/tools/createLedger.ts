import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const createLedgerSchema = z.object({
	name: z.string().describe("The name of the ledger to create."),
	group: z.string().describe("The group under which to create the ledger."),
	openingBalance: z
		.number()
		.optional()
		.describe("Opening balance for the ledger."),
});

export function registerCreateLedgerTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient } = context;

	server.registerToolWithHandler(
		"createLedger",
		"Creates a new ledger in Tally.",
		createLedgerSchema,
		async (args: { name: string; group: string; openingBalance?: number }) => {
			const { name, group, openingBalance = 0 } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Import Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <IMPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>All Masters</REPORTNAME>
                </REQUESTDESC>
                <REQUESTDATA>
                    <TALLYMESSAGE xmlns:UDF="TallyUDF">
                        <LEDGER NAME="${name}" ACTION="Create">
                            <NAME>${name}</NAME>
                            <PARENT>${group}</PARENT>
                            <OPENINGBALANCE>${openingBalance}</OPENINGBALANCE>
                        </LEDGER>
                    </TALLYMESSAGE>
                </REQUESTDATA>
            </IMPORTDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const responseText = response.rawXml || "";

				if (
					responseText.toLowerCase().includes("created") ||
					responseText.toLowerCase().includes("success") ||
					responseText.toLowerCase().includes("accepted")
				) {
					return `Ledger created successfully:\nName: ${name}\nGroup: ${group}\nOpening Balance: ${openingBalance}`;
				}
				return `Failed to create ledger. Response: ${responseText.slice(0, 200)}`;
			} catch (error: any) {
				return `Error creating ledger: ${error.message}`;
			}
		}
	);
}
