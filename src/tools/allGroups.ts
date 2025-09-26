import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

export function registerAllGroupsTool(
  server: TallyMcpServer,
  context: ToolContext
): void {
  const { httpClient, xmlParser } = context;

  server.registerToolWithHandler(
    "get_all_groups",
    "Retrieves a list of all account groups from Tally.",
    { type: "object", properties: {} },
    async (_args: any) => {
      const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Accounts</REPORTNAME>
                    <STATICVARIABLES>
                        <ACCOUNTTYPE>All Groups</ACCOUNTTYPE>
                    </STATICVARIABLES>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

      try {
        const response = await httpClient.post(xmlRequest);
        const parsedXml = xmlParser.parse(response.rawXml || "");

        const groups = xmlParser.findElements(parsedXml, "GROUP");
        if (!groups || groups.length === 0) {
          return "No groups found.";
        }

        let groupList = "List of all groups:\n\n";
        for (const group of groups) {
          const groupName = xmlParser.getElementAttribute(group, "NAME");
          const parent = xmlParser.getElementText(group, ["PARENT"]);
          const parentName = parent || "Primary";
          groupList += `- ${groupName || "N/A"} (Parent: ${parentName})\n`;
        }

        return groupList;
      } catch (error: any) {
        return `Error parsing Tally response: ${error.message}`;
      }
    }
  );
}
