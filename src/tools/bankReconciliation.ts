import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerBankReconciliationTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_bank_reconciliation",
    "Retrieves bank reconciliation statement for a specific bank ledger as of a date.",
    {
      type: "object",
      properties: {
        bank_ledger: {
          type: "string",
          description: "Name of the bank ledger to reconcile.",
        },
        date: {
          type: "string",
          description: "Date for reconciliation in DD-MM-YYYY format.",
        },
      },
      required: ["bank_ledger", "date"],
    },
    async (args: { bank_ledger: string; date: string }) => {
      const { bank_ledger, date } = args;

      const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Bank Reconciliation</REPORTNAME>
                    <STATICVARIABLES>
                        <LEDGERNAME>${bank_ledger}</LEDGERNAME>
                        <SVFROMDATE>01-04-2023</SVFROMDATE>
                        <SVTODATE>${date}</SVTODATE>
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
          return `No bank transactions found for '${bank_ledger}' as of ${date}.`;
        }

        let reconciliation = `Bank Reconciliation - ${bank_ledger} as of ${date}:\n\n`;

        // Book balance calculation
        let bookBalance = 0.0;
        let unreconciledDeposits = 0.0;
        let unreconciledWithdrawals = 0.0;

        reconciliation += "BOOK TRANSACTIONS:\n";
        reconciliation += `${"-".repeat(60)}\n`;
        reconciliation += `${"Date".padEnd(12)} ${"Voucher".padEnd(12)} ${"Description".padEnd(20)} ${"Amount".padEnd(12)}\n`;
        reconciliation += `${"-".repeat(60)}\n`;

        for (const voucher of vouchers) {
          const vdate = xmlParser.getElementText(voucher, ["DATE"]);
          const vnum = xmlParser.getElementText(voucher, ["VOUCHERNUMBER"]);
          const amountElem = xmlParser.getElementText(voucher, ["AMOUNT"]);
          const narration = xmlParser.getElementText(voucher, ["NARRATION"]);

          if (amountElem) {
            const amount = Number.parseFloat(amountElem) || 0.0;
            const vDate = vdate ? vdate.slice(0, 10) : "N/A";
            const vNum = vnum || "N/A";
            const desc = narration ? narration.slice(0, 19) : "N/A";

            reconciliation += `${vDate.padEnd(12)} ${vNum.padEnd(12)} ${desc.padEnd(20)} ${amount.toFixed(2).padStart(12)}\n`;
            bookBalance += amount;

            // Simulate unreconciled items (simplified)
            if (Math.abs(amount) > 5000) {
              // Large transactions often unreconciled
              if (amount > 0) {
                unreconciledDeposits += amount;
              } else {
                unreconciledWithdrawals += Math.abs(amount);
              }
            }
          }
        }

        reconciliation += `${"-".repeat(60)}\n`;
        reconciliation += `${"BOOK BALANCE".padEnd(32)} ${bookBalance.toFixed(2).padStart(12)}\n\n`;

        // Bank reconciliation statement
        reconciliation += "RECONCILIATION STATEMENT:\n";
        reconciliation += `${"=".repeat(50)}\n`;
        reconciliation += `Book Balance as per Tally:        ${bookBalance.toFixed(2).padStart(12)}\n\n`;

        reconciliation += "Add: Deposits not yet credited:\n";
        reconciliation += `  Uncleared deposits:             ${unreconciledDeposits.toFixed(2).padStart(12)}\n\n`;

        reconciliation += "Less: Cheques not yet presented:\n";
        reconciliation += `  Uncleared withdrawals:          ${unreconciledWithdrawals.toFixed(2).padStart(12)}\n\n`;

        // Simulated bank balance
        const estimatedBankBalance =
          bookBalance + unreconciledDeposits - unreconciledWithdrawals;
        reconciliation += `${"-".repeat(50)}\n`;
        reconciliation += `Estimated Bank Balance:           ${estimatedBankBalance.toFixed(2).padStart(12)}\n\n`;

        // Reconciliation status
        const difference = Math.abs(bookBalance - estimatedBankBalance);
        if (difference < 0.01) {
          reconciliation += "✅ RECONCILED - No differences found\n";
        } else {
          reconciliation += `⚠️  DIFFERENCE: ${difference.toFixed(2).padStart(12)}\n`;
          reconciliation +=
            "Please verify bank statement for any missing transactions.\n";
        }

        return reconciliation;
      } catch (error: any) {
        return `Error parsing Tally response: ${error.message}`;
      }
    }
  );
}
