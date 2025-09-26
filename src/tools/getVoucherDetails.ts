import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerGetVoucherDetailsTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_voucher_details",
    "Retrieves details of a specific voucher from Tally.",
    {
      type: "object",
      properties: {
        voucher_number: {
          type: "string",
          description: "The voucher number to retrieve.",
        },
        voucher_type: {
          type: "string",
          description:
            "The voucher type (e.g., 'Sales', 'Purchase', 'Payment', 'Receipt', 'Journal').",
        },
      },
      required: ["voucher_number", "voucher_type"],
    },
    async (args: { voucher_number: string; voucher_type: string }) => {
      const { voucher_number, voucher_type } = args;

      const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Voucher Register</REPORTNAME>
                    <STATICVARIABLES>
                        <VOUCHERTYPENAME>${voucher_type}</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${voucher_number}</VOUCHERNUMBER>
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
          return `No voucher found with number '${voucher_number}' of type '${voucher_type}'.`;
        }

        let voucherDetails = `Voucher Details - ${voucher_type} #${voucher_number}:\n\n`;

        for (const voucher of vouchers) {
          const date = xmlParser.getElementText(voucher, ["DATE"]);
          const party = xmlParser.getElementText(voucher, ["PARTYLEDGERNAME"]);
          const narration = xmlParser.getElementText(voucher, ["NARRATION"]);
          const amount = xmlParser.getElementText(voucher, ["AMOUNT"]);

          voucherDetails += `Date: ${date || "N/A"}\n`;
          voucherDetails += `Party: ${party || "N/A"}\n`;
          voucherDetails += `Amount: ${amount || "N/A"}\n`;
          voucherDetails += `Narration: ${narration || "N/A"}\n\n`;

          // Ledger entries
          const ledgerEntries = xmlParser.findElements(
            voucher,
            "ALLLEDGERENTRIES.LIST"
          );
          if (ledgerEntries && ledgerEntries.length > 0) {
            voucherDetails += "Ledger Entries:\n";
            voucherDetails += `${"Ledger".padEnd(25)} ${"Debit".padEnd(12)} ${"Credit".padEnd(12)}\n`;
            voucherDetails += `${"-".repeat(50)}\n`;

            for (const entry of ledgerEntries) {
              const ledgerName = xmlParser.getElementText(entry, [
                "LEDGERNAME",
              ]);
              const entryAmount = xmlParser.getElementText(entry, ["AMOUNT"]);
              const isPositive = xmlParser.getElementText(entry, [
                "ISDEEMEDPOSITIVE",
              ]);

              if (ledgerName && entryAmount) {
                const ledger = ledgerName.slice(0, 24);
                const amt = Number.parseFloat(entryAmount) || 0.0;

                if (isPositive === "Yes") {
                  voucherDetails += `${ledger.padEnd(25)} ${amt.toFixed(2).padEnd(12)} ${"".padEnd(12)}\n`;
                } else {
                  voucherDetails += `${ledger.padEnd(25)} ${"".padEnd(12)} ${Math.abs(amt).toFixed(2).padEnd(12)}\n`;
                }
              }
            }
          }
        }

        return voucherDetails;
      } catch (error: any) {
        return `Error parsing Tally response: ${error.message}`;
      }
    }
  );
}
