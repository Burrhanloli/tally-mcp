import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerGstReportTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_gst_report",
    "Retrieves GST summary report from Tally for a specified date range.",
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
                    <REPORTNAME>GST Returns Summary</REPORTNAME>
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

        const gstEntries =
          xmlParser.findElements(parsedXml, "GSTRETURN") ||
          xmlParser.findElements(parsedXml, "VOUCHER");

        if (!gstEntries || gstEntries.length === 0) {
          return `No GST data found for period ${from_date} to ${to_date}.`;
        }

        let gstReport = `GST Summary Report from ${from_date} to ${to_date}:\n\n`;

        // GST Summary sections
        gstReport += "OUTWARD SUPPLIES (Sales):\n";
        gstReport += `${"-".repeat(50)}\n`;
        gstReport += `${"Description".padEnd(25)} ${"Taxable Value".padEnd(15)} ${"GST Amount".padEnd(12)}\n`;
        gstReport += `${"-".repeat(50)}\n`;

        let totalTaxableSales = 0.0;
        let totalGstOutput = 0.0;

        for (const entry of gstEntries) {
          // Look for sales entries with GST
          const vtype = xmlParser.getElementText(entry, ["VOUCHERTYPENAME"]);
          if (vtype?.toLowerCase().includes("sales")) {
            const taxableValue =
              xmlParser.getElementText(entry, ["TAXABLEVALUE"]) ||
              xmlParser.getElementText(entry, ["AMOUNT"]);
            const gstAmount =
              xmlParser.getElementText(entry, ["GSTAMOUNT"]) ||
              xmlParser.getElementText(entry, ["IGSTAMOUNT"]);

            if (taxableValue) {
              const taxable = Number.parseFloat(taxableValue) || 0.0;
              const gst = gstAmount
                ? Number.parseFloat(gstAmount) || 0.0
                : taxable * 0.18; // Assume 18% if not found

              if (taxable > 0) {
                gstReport += `${"Sales @ 18%".padEnd(25)} ${taxable.toFixed(2).padEnd(15)} ${gst.toFixed(2).padEnd(12)}\n`;
                totalTaxableSales += taxable;
                totalGstOutput += gst;
              }
            }
          }
        }

        gstReport += `${"-".repeat(50)}\n`;
        gstReport += `${"Total Outward".padEnd(25)} ${totalTaxableSales.toFixed(2).padEnd(15)} ${totalGstOutput.toFixed(2).padEnd(12)}\n\n`;

        // Inward supplies (Purchases)
        gstReport += "INWARD SUPPLIES (Purchases):\n";
        gstReport += `${"-".repeat(50)}\n`;
        gstReport += `${"Description".padEnd(25)} ${"Taxable Value".padEnd(15)} ${"GST Amount".padEnd(12)}\n`;
        gstReport += `${"-".repeat(50)}\n`;

        let totalTaxablePurchases = 0.0;
        let totalGstInput = 0.0;

        for (const entry of gstEntries) {
          // Look for purchase entries with GST
          const vtype = xmlParser.getElementText(entry, ["VOUCHERTYPENAME"]);
          if (vtype?.toLowerCase().includes("purchase")) {
            const taxableValue =
              xmlParser.getElementText(entry, ["TAXABLEVALUE"]) ||
              xmlParser.getElementText(entry, ["AMOUNT"]);
            const gstAmount =
              xmlParser.getElementText(entry, ["GSTAMOUNT"]) ||
              xmlParser.getElementText(entry, ["IGSTAMOUNT"]);

            if (taxableValue) {
              const taxable = Number.parseFloat(taxableValue) || 0.0;
              const gst = gstAmount
                ? Number.parseFloat(gstAmount) || 0.0
                : taxable * 0.18;

              if (taxable > 0) {
                gstReport += `${"Purchases @ 18%".padEnd(25)} ${taxable.toFixed(2).padEnd(15)} ${gst.toFixed(2).padEnd(12)}\n`;
                totalTaxablePurchases += taxable;
                totalGstInput += gst;
              }
            }
          }
        }

        gstReport += `${"-".repeat(50)}\n`;
        gstReport += `${"Total Inward".padEnd(25)} ${totalTaxablePurchases.toFixed(2).padEnd(15)} ${totalGstInput.toFixed(2).padEnd(12)}\n\n`;

        // Net GST liability
        const netGstLiability = totalGstOutput - totalGstInput;
        gstReport += "GST LIABILITY:\n";
        gstReport += `${"=".repeat(50)}\n`;
        gstReport += `Output GST (Sales):     ${totalGstOutput.toFixed(2).padStart(12)}\n`;
        gstReport += `Input GST (Purchases):  ${totalGstInput.toFixed(2).padStart(12)}\n`;
        gstReport += `${"-".repeat(50)}\n`;

        const liabilityType =
          netGstLiability > 0 ? "Net GST Payable" : "Net GST Refund";
        gstReport += `${liabilityType}:      ${Math.abs(netGstLiability).toFixed(2).padStart(12)}\n`;

        return gstReport;
      } catch (error: any) {
        return `Error parsing Tally response: ${error.message}`;
      }
    }
  );
}
