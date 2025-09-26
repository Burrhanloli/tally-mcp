import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerLedgerVouchersTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_ledger_vouchers",
    "Retrieves all vouchers for a specific ledger within a date range.",
    {
      type: "object",
      properties: {
        ledger_name: {
          type: "string",
          description: "The name of the ledger.",
        },
        from_date: {
          type: "string",
          description: "The start date in DD-MM-YYYY format.",
        },
        to_date: {
          type: "string",
          description: "The end date in DD-MM-YYYY format.",
        },
      },
      required: ["ledger_name", "from_date", "to_date"],
    },
    async (args: {
      ledger_name: string;
      from_date: string;
      to_date: string;
    }) => {
      const { ledger_name, from_date, to_date } = args;

      const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Ledger Vouchers</REPORTNAME>
                    <STATICVARIABLES>
                        <LEDGERNAME>${ledger_name}</LEDGERNAME>
                        <SVFROMDATE>${from_date}</SVFROMDATE>
                        <SVTODATE>${to_date}</SVTODATE>
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
          return `No vouchers found for ledger '${ledger_name}' in this period.`;
        }

        let ledgerReport = `Vouchers for ${ledger_name} from ${from_date} to ${to_date}:\n\n`;
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
