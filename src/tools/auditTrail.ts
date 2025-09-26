import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerAuditTrailTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_audit_trail",
    "Retrieves audit trail report showing all modifications and transactions within a date range.",
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
                    <REPORTNAME>Audit Trail</REPORTNAME>
                    <STATICVARIABLES>
                        <SVFROMDATE>${from_date}</SVFROMDATE>
                        <SVTODATE>${to_date}</SVTODATE>
                        <INCLUDEMODIFICATIONS>Yes</INCLUDEMODIFICATIONS>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

      try {
        const response = await httpClient.post(xmlRequest);
        const parsedXml = xmlParser.parse(response.rawXml || "");

        const auditEntries =
          xmlParser.findElements(parsedXml, "VOUCHER") ||
          xmlParser.findElements(parsedXml, "AUDITENTRY");

        if (!auditEntries || auditEntries.length === 0) {
          return `No audit trail data found for period ${from_date} to ${to_date}.`;
        }

        let auditReport = `Audit Trail Report from ${from_date} to ${to_date}:\n\n`;

        // Summary counters
        let totalEntries = 0;
        let createdEntries = 0;
        let modifiedEntries = 0;
        let deletedEntries = 0;

        auditReport += "TRANSACTION HISTORY:\n";
        auditReport += `${"-".repeat(80)}\n`;
        auditReport += `${"Date".padEnd(12)} ${"Time".padEnd(8)} ${"Type".padEnd(10)} ${"Voucher".padEnd(12)} ${"Action".padEnd(10)} ${"User".padEnd(15)}\n`;
        auditReport += `${"-".repeat(80)}\n`;

        // Limit to first 50 entries for readability
        const entriesToProcess = auditEntries.slice(0, 50);

        for (const entry of entriesToProcess) {
          const dateElem =
            xmlParser.getElementText(entry, ["DATE"]) ||
            xmlParser.getElementText(entry, ["ALTERDATE"]);
          const timeElem =
            xmlParser.getElementText(entry, ["TIME"]) ||
            xmlParser.getElementText(entry, ["ALTERTIME"]);
          const vtypeElem = xmlParser.getElementText(entry, [
            "VOUCHERTYPENAME",
          ]);
          const vnumElem = xmlParser.getElementText(entry, ["VOUCHERNUMBER"]);
          const actionElem =
            xmlParser.getElementText(entry, ["ACTION"]) ||
            xmlParser.getElementText(entry, ["ALTERATION"]);
          const userElem =
            xmlParser.getElementText(entry, ["USERNAME"]) ||
            xmlParser.getElementText(entry, ["ALTEREDBY"]);

          // Extract information
          const entryDate = dateElem ? dateElem.slice(0, 10) : "N/A";
          const entryTime = timeElem || "N/A";
          const voucherType = vtypeElem || "N/A";
          const voucherNum = vnumElem || "N/A";
          const action = actionElem || "Created";
          const user = userElem || "Admin";

          // Count actions
          totalEntries++;
          let actionDisplay = "Create";
          if (
            action.toLowerCase().includes("create") ||
            action.toLowerCase().includes("new")
          ) {
            createdEntries++;
            actionDisplay = "Create";
          } else if (
            action.toLowerCase().includes("modify") ||
            action.toLowerCase().includes("alter") ||
            action.toLowerCase().includes("update")
          ) {
            modifiedEntries++;
            actionDisplay = "Modify";
          } else if (
            action.toLowerCase().includes("delete") ||
            action.toLowerCase().includes("remove")
          ) {
            deletedEntries++;
            actionDisplay = "Delete";
          } else {
            createdEntries++; // Default to created
          }

          auditReport += `${entryDate.padEnd(12)} ${entryTime.slice(0, 8).padEnd(8)} ${voucherType.slice(0, 9).padEnd(10)} ${voucherNum.slice(0, 11).padEnd(12)} ${actionDisplay.padEnd(10)} ${user.slice(0, 14).padEnd(15)}\n`;
        }

        auditReport += `${"-".repeat(80)}\n`;

        // Audit Summary
        auditReport += "\nAUDIT SUMMARY:\n";
        auditReport += `${"=".repeat(50)}\n`;
        auditReport += `Total Entries Reviewed:     ${totalEntries.toString().padStart(8)}\n`;
        auditReport += `New Transactions:           ${createdEntries.toString().padStart(8)}\n`;
        auditReport += `Modified Transactions:      ${modifiedEntries.toString().padStart(8)}\n`;
        auditReport += `Deleted Transactions:       ${deletedEntries.toString().padStart(8)}\n\n`;

        // Activity Analysis
        auditReport += "ACTIVITY ANALYSIS:\n";
        auditReport += `${"-".repeat(30)}\n`;

        if (totalEntries > 0) {
          const createPct = (createdEntries / totalEntries) * 100;
          const modifyPct = (modifiedEntries / totalEntries) * 100;
          const deletePct = (deletedEntries / totalEntries) * 100;

          auditReport += `Creation Activity:    ${createPct.toFixed(1).padStart(6)}%\n`;
          auditReport += `Modification Activity: ${modifyPct.toFixed(1).padStart(6)}%\n`;
          auditReport += `Deletion Activity:    ${deletePct.toFixed(1).padStart(6)}%\n\n`;
        }

        // Security Assessment
        auditReport += "SECURITY ASSESSMENT:\n";
        auditReport += `${"-".repeat(25)}\n`;

        if (modifiedEntries > totalEntries * 0.3) {
          auditReport +=
            "⚠️  HIGH MODIFICATION RATE - Review changes for accuracy\n";
        } else if (modifiedEntries > totalEntries * 0.1) {
          auditReport +=
            "⚡ MODERATE MODIFICATION RATE - Normal business activity\n";
        } else {
          auditReport +=
            "✅ LOW MODIFICATION RATE - Stable transaction environment\n";
        }

        if (deletedEntries > 0) {
          auditReport += `⚠️  ${deletedEntries} DELETIONS DETECTED - Verify authorization\n`;
        } else {
          auditReport += "✅ NO DELETIONS - Data integrity maintained\n";
        }

        // Compliance Note
        const fromDateObj = new Date(from_date.split("-").reverse().join("-"));
        const toDateObj = new Date(to_date.split("-").reverse().join("-"));
        const daysDiff =
          Math.floor(
            (toDateObj.getTime() - fromDateObj.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;

        auditReport += "\n📋 COMPLIANCE NOTE:\n";
        auditReport += `Audit trail covers ${daysDiff} days of activity.\n`;
        auditReport +=
          "All transaction modifications are logged for regulatory compliance.\n";
        auditReport += `Report generated on: ${new Date().toLocaleString()}\n`;

        return auditReport;
      } catch (error: any) {
        return `Error parsing Tally response: ${error.message}`;
      }
    }
  );
}
