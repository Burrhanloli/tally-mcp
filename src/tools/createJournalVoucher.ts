import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerCreateJournalVoucherTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient } = context;

  server.registerToolWithHandler(
    "create_journal_voucher",
    "Creates a journal voucher in Tally for general entries.",
    {
      type: "object",
      properties: {
        debit_ledger: {
          type: "string",
          description: "Ledger to be debited.",
        },
        credit_ledger: {
          type: "string",
          description: "Ledger to be credited.",
        },
        amount: {
          type: "number",
          description: "Transaction amount.",
        },
        date: {
          type: "string",
          description: "Date of transaction in DD-MM-YYYY format.",
        },
        narration: {
          type: "string",
          description: "Description of the transaction.",
        },
      },
      required: [
        "debit_ledger",
        "credit_ledger",
        "amount",
        "date",
        "narration",
      ],
    },
    async (args: {
      debit_ledger: string;
      credit_ledger: string;
      amount: number;
      date: string;
      narration: string;
    }) => {
      const { debit_ledger, credit_ledger, amount, date, narration } = args;

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
                        <VOUCHER VCHTYPE="Journal" ACTION="Create">
                            <DATE>${date}</DATE>
                            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                            <NARRATION>${narration}</NARRATION>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>${debit_ledger}</LEDGERNAME>
                                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                <AMOUNT>${amount}</AMOUNT>
                            </ALLLEDGERENTRIES.LIST>
                            <ALLLEDGERENTRIES.LIST>
                                <LEDGERNAME>${credit_ledger}</LEDGERNAME>
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
          return `Journal voucher created successfully:\nDebit: ${debit_ledger} - ${amount}\nCredit: ${credit_ledger} - ${amount}\nDate: ${date}\nNarration: ${narration}`;
        }
        return `Failed to create journal voucher. Response: ${responseText.slice(0, 200)}`;
      } catch (error: any) {
        return `Error creating journal voucher: ${error.message}`;
      }
    }
  );
}
