import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const allLedgersSchema = z.object({});

export function registerAllLedgersTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getAllLedgers",
		"Retrieves a list of all ledger accounts from Tally.",
		allLedgersSchema,
		async (_args: Record<string, never>) => {
			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Accounts</REPORTNAME>
                    <STATICVARIABLES>
                        <ACCOUNTTYPE>All Ledger Masters</ACCOUNTTYPE>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const parsedXml = xmlParser.parse(response.rawXml || "");

				const ledgers = xmlParser.findElements(parsedXml, "LEDGER");
				if (!ledgers || ledgers.length === 0) {
					return "No ledgers found.";
				}

				let ledgerList = "List of all ledgers:\n\n";
				for (const ledger of ledgers) {
					const ledgerName = xmlParser.getElementAttribute(ledger, "NAME");
					ledgerList += `- ${ledgerName || "N/A"}\n`;
				}

				return ledgerList;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
