import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const voucherTypesSchema = z.object({});

export function registerVoucherTypesTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"getVoucherTypes",
		"Retrieves a list of all voucher types from Tally.",
		voucherTypesSchema,
		async (_args: any) => {
			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Voucher Types</REPORTNAME>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const parsedXml = xmlParser.parse(response.rawXml || "");

				const voucherTypes = xmlParser.findElements(parsedXml, "VOUCHERTYPE");
				if (!voucherTypes || voucherTypes.length === 0) {
					return "No voucher types found.";
				}

				let voucherList = "List of all voucher types:\n\n";
				for (const vtype of voucherTypes) {
					const vtypeName = xmlParser.getElementAttribute(vtype, "NAME");
					const parent = xmlParser.getElementText(vtype, ["PARENT"]);
					const parentName = parent || "N/A";
					voucherList += `- ${vtypeName || "N/A"} (Parent: ${parentName})\n`;
				}

				return voucherList;
			} catch (error: any) {
				return `Error parsing Tally response: ${error.message}`;
			}
		}
	);
}
