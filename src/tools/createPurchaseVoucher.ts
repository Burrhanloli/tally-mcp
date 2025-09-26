import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerCreatePurchaseVoucherTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient } = context;

  server.registerToolWithHandler(
    "create_purchase_voucher",
    "Creates a purchase voucher in Tally.",
    {
      type: "object",
      properties: {
        party: {
          type: "string",
          description: "Supplier name (ledger name).",
        },
        items: {
          type: "string",
          description: "Description of items purchased.",
        },
        amount: {
          type: "number",
          description: "Total purchase amount.",
        },
        date: {
          type: "string",
          description: "Date of purchase in DD-MM-YYYY format.",
        },
      },
      required: ["party", "items", "amount", "date"],
    },
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
