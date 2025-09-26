import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerCompanyInfoTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_company_info",
    "Retrieves basic company information from Tally.",
    {
      type: "object",
      properties: {},
    },
    async (_args: Record<string, never>) => {
      const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Companies</REPORTNAME>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

      try {
        const response = await httpClient.post(xmlRequest);
        const parsedXml = xmlParser.parse(response.rawXml || "");

        const companies = xmlParser.findElements(parsedXml, "COMPANY");
        if (!companies || companies.length === 0) {
          return "No company information found.";
        }

        let companyInfo = "Company Information:\n\n";
        for (const company of companies) {
          const name = xmlParser.getElementAttribute(company, "NAME");
          companyInfo += `- Company: ${name || "N/A"}\n`;
        }

        return companyInfo;
      } catch (error: any) {
        return `Error parsing Tally response: ${error.message}`;
      }
    }
  );
}
