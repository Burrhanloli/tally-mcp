import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerCreateReceiptVoucherTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient } = context;

  server.registerToolWithHandler(
    "create_receipt_voucher",
    "Creates a receipt voucher in Tally.",
    {
      type: "object",
      properties: {
        party: {
          type: "string",
          description:
            "Party name from whom receipt is received (ledger name).",
        },
        amount: {
          type: "number",
          description: "Receipt amount.",
        },
        date: {
          type: "string",
          description: "Date of receipt in DD-MM-YYYY format.",
        },
        receipt_method: {
          type: "string",
          description:
            "Receipt method - 'Cash' or bank ledger name (default: 'Cash').",
        },
      },
      required: ["party", "amount", "date"],
    },
    async (args: {
      party: string;
      amount: number;
      date: string;
      receipt_method?: string;
    }) => {
      const { party, amount, date, receipt_method = "Cash" } = args;

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
                                <LEDGERNAME>${receipt_method}</LEDGERNAME>
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
          return `Receipt voucher created successfully:\nParty: ${party}\nAmount: ${amount}\nDate: ${date}\nReceipt Method: ${receipt_method}`;
        }
        return `Failed to create receipt voucher. Response: ${responseText.slice(0, 200)}`;
      } catch (error: any) {
        return `Error creating receipt voucher: ${error.message}`;
      }
    }
  );
}
