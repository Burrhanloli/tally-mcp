import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerCreateSalesVoucherTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient } = context;

  server.registerToolWithHandler(
    "create_sales_voucher",
    "Creates a sales voucher in Tally.",
    {
      type: "object",
      properties: {
        party: {
          type: "string",
          description: "Customer name (ledger name).",
        },
        items: {
          type: "string",
          description: "Description of items sold.",
        },
        amount: {
          type: "number",
          description: "Total sales amount.",
        },
        date: {
          type: "string",
          description: "Date of sale in DD-MM-YYYY format.",
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
