import { z } from "zod";
import type { TallyMcpServer } from "../server.js";
import type { ToolContext } from "./index.js";

const backupCompanySchema = z.object({
	backupPath: z
		.string()
		.describe(
			"The path where backup should be created (e.g., 'C:\\\\Backups\\\\')."
		),
});

export function registerBackupCompanyTool(
	server: TallyMcpServer,
	context: ToolContext
): void {
	const { httpClient, xmlParser } = context;

	server.registerToolWithHandler(
		"backupCompany",
		"Creates a backup of the company data in Tally.",
		backupCompanySchema,
		async (args: { backupPath: string }) => {
			const { backupPath } = args;

			const xmlRequest = `<ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Backup</TALLYREQUEST>
        </HEADER>
        <BODY>
            <BACKUPDATA>
                <REQUESTDESC>
                    <BACKUPPATH>${backupPath}</BACKUPPATH>
                    <COMPRESSDATA>Yes</COMPRESSDATA>
                    <INCLUDEIMAGES>Yes</INCLUDEIMAGES>
                </REQUESTDESC>
            </BACKUPDATA>
        </BODY>
    </ENVELOPE>`;

			try {
				const response = await httpClient.post(xmlRequest);
				const responseText = response.rawXml || "";

				// Check for backup status
				const parsedXml = xmlParser.parse(responseText);
				const statusElem = xmlParser.findElements(parsedXml, "STATUS");
				const messageElem = xmlParser.findElements(parsedXml, "MESSAGE");

				const status =
					statusElem && statusElem.length > 0
						? xmlParser.getElementText(statusElem[0], [])
						: "";
				const message =
					messageElem && messageElem.length > 0
						? xmlParser.getElementText(messageElem[0], [])
						: "";

				if (status?.toLowerCase().includes("success")) {
					const timestamp = new Date()
						.toISOString()
						.replace(/[:.]/g, "")
						.slice(0, 15);
					const backupFile = `${backupPath}\\company_backup_${timestamp}.zip`;
					return `✅ Company backup created successfully!\n\nBackup Details:\n- Location: ${backupFile}\n- Status: Completed\n- Compression: Enabled\n- Images: Included\n- Date: ${new Date().toLocaleString()}\n\nPlease verify the backup file exists at the specified location.`;
				}
				if (responseText.toLowerCase().includes("backup")) {
					// Generic success response
					const timestamp = new Date()
						.toISOString()
						.replace(/[:.]/g, "")
						.slice(0, 15);
					const backupFile = `${backupPath}\\tally_backup_${timestamp}.zip`;
					return `✅ Backup process initiated successfully!\n\nBackup Details:\n- Target Path: ${backupFile}\n- Status: In Progress/Completed\n- Compression: Enabled\n- Date: ${new Date().toLocaleString()}\n\nNote: Please check Tally application for backup completion status.\nEnsure the target directory has sufficient space and write permissions.`;
				}
				const errorMsg = message || "Unknown error";
				return `❌ Backup failed: ${errorMsg}\n\nPossible causes:\n- Invalid backup path\n- Insufficient permissions\n- Disk space issues\n- Tally application not responding\n\nPlease verify the backup path and try again.`;
			} catch (error: any) {
				return `Error during backup operation: ${error.message}\n\nTroubleshooting:\n1. Ensure Tally is running and accessible\n2. Verify backup path exists and is writable\n3. Check network connectivity to Tally server\n4. Ensure sufficient disk space at backup location`;
			}
		}
	);
}
