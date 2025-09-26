import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerTrialBalanceTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_trial_balance",
    "Retrieves trial balance report from Tally for a specified date range.",
    {
      type: "object",
      properties: {
        from_date: {
          type: "string",
          description: "The start date in DD-MM-YYYY format.",
        },
        to_date: {
          type: "string",
          description: "The end date in DD-MM-YYYY format.",
        },
      },
      required: ["from_date", "to_date"],
    },
    async (args: { from_date: string; to_date: string }) => {
      const { from_date, to_date } = args;

      const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>Trial Balance</REPORTNAME>
                    <STATICVARIABLES>
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

        const ledgers = xmlParser.findElements(parsedXml, "LEDGER");
        if (!ledgers || ledgers.length === 0) {
          return `No trial balance data found for period ${from_date} to ${to_date}.`;
        }

        let trialBalance = `Trial Balance from ${from_date} to ${to_date}:\n\n`;
        trialBalance += `${"Ledger Name".padEnd(30)} ${"Debit".padEnd(15)} ${"Credit".padEnd(15)}\n`;
        trialBalance += `${"-".repeat(60)}\n`;

        let totalDebit = 0.0;
        let totalCredit = 0.0;

        for (const ledger of ledgers) {
          const name = xmlParser.getElementAttribute(ledger, "NAME") || "N/A";
          const openingBalance = xmlParser.getElementText(ledger, [
            "OPENINGBALANCE",
          ]);
          const closingBalance = xmlParser.getElementText(ledger, [
            "CLOSINGBALANCE",
          ]);

          let balance = 0.0;
          if (closingBalance) {
            balance = Number.parseFloat(closingBalance) || 0.0;
          } else if (openingBalance) {
            balance = Number.parseFloat(openingBalance) || 0.0;
          }

          if (balance > 0) {
            trialBalance += `${name.padEnd(30)} ${balance.toFixed(2).padEnd(15)} ${"".padEnd(15)}\n`;
            totalDebit += balance;
          } else if (balance < 0) {
            trialBalance += `${name.padEnd(30)} ${"".padEnd(15)} ${Math.abs(balance).toFixed(2).padEnd(15)}\n`;
            totalCredit += Math.abs(balance);
          }
        }

        trialBalance += `${"-".repeat(60)}\n`;
        trialBalance += `${"TOTAL".padEnd(30)} ${totalDebit.toFixed(2).padEnd(15)} ${totalCredit.toFixed(2)}\n`;

        return trialBalance;
      } catch (error: any) {
        return `Error parsing Tally response: ${error.message}`;
      }
    }
  );
}
