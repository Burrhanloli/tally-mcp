import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerCreatePaymentVoucherTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient } = context;

  server.registerToolWithHandler(
    "create_payment_voucher",
    "Creates a payment voucher in Tally.",
    {
      type: "object",
      properties: {
        party: {
          type: "string",
          description: "Party name to whom payment is made (ledger name).",
        },
        amount: {
          type: "number",
          description: "Payment amount.",
        },
        date: {
          type: "string",
          description: "Date of payment in DD-MM-YYYY format.",
        },
        payment_method: {
          type: "string",
          description:
            "Payment method - 'Cash' or bank ledger name (default: 'Cash').",
        },
      },
      required: ["party", "amount", "date"],
    },
    async (args: {
      party: string;
      amount: number;
      date: string;
      payment_method?: string;
    }) => {
      const { party, amount, date, payment_method = "Cash" } = args;

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
                        <VOUCHER VCHTYPE="Payment" ACTION="Create">
                            <DATE>${date}</DATE>
                            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
                            <PARTYLEDGERNAME>${party}</PARTYLEDGERNAME>
                            <NARRATION>Payment to ${party}</NARRATION>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>${party}</LEDGERNAME>
                                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                <AMOUNT>${amount}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>${payment_method}</LEDGERNAME>
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
          return `Payment voucher created successfully:\nParty: ${party}\nAmount: ${amount}\nDate: ${date}\nPayment Method: ${payment_method}`;
        }
        return `Failed to create payment voucher. Response: ${responseText.slice(0, 200)}`;
      } catch (error: any) {
        return `Error creating payment voucher: ${error.message}`;
      }
    }
  );
}
