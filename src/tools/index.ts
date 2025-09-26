import type { TallyMcpServer } from "../server.js";
import type { TallyHttpClient } from "../utils/httpClient.js";
import type { TallyXmlParser } from "../utils/xmlParser.js";

// Tool context type
export type ToolContext = {
	httpClient: TallyHttpClient;
	xmlParser: TallyXmlParser;
};

import { registerAgeAnalysisTool } from "./ageAnalysis.js";
import { registerAllGroupsTool } from "./allGroups.js";
import { registerAllLedgersTool } from "./allLedgers.js";
// Import remaining tools
import { registerAllStockItemsTool } from "./allStockItems.js";
import { registerAuditTrailTool } from "./auditTrail.js";
import { registerBackupCompanyTool } from "./backupCompany.js";
import { registerBalanceSheetTool } from "./balanceSheet.js";
import { registerBankReconciliationTool } from "./bankReconciliation.js";
import { registerBudgetVsActualTool } from "./budgetVsActual.js";
import { registerCashFlowTool } from "./cashFlow.js";
import { registerCompanyInfoTool } from "./companyInfo.js";
import { registerCreateJournalVoucherTool } from "./createJournalVoucher.js";
import { registerCreateLedgerTool } from "./createLedger.js";
import { registerCreatePaymentVoucherTool } from "./createPaymentVoucher.js";
import { registerCreatePurchaseVoucherTool } from "./createPurchaseVoucher.js";
import { registerCreateReceiptVoucherTool } from "./createReceiptVoucher.js";
import { registerCreateSalesVoucherTool } from "./createSalesVoucher.js";
import { registerCreateStockItemTool } from "./createStockItem.js";
// Import individual tool modules
import { registerDayBookTool } from "./dayBook.js";
import { registerGetVoucherDetailsTool } from "./getVoucherDetails.js";
import { registerGstReportTool } from "./gstReport.js";
import { registerLedgerVouchersTool } from "./ledgerVouchers.js";
import { registerOutstandingPayablesTool } from "./outstandingPayables.js";
import { registerOutstandingReceivablesTool } from "./outstandingReceivables.js";
import { registerProfitLossTool } from "./profitLoss.js";
import { registerStockSummaryTool } from "./stockSummary.js";
import { registerTrialBalanceTool } from "./trialBalance.js";
import { registerVoucherTypesTool } from "./voucherTypes.js";
// import { registerBalanceSheetTool } from './balanceSheet.js';
// import { registerCashFlowTool } from './cashFlow.js';
// import { registerStockSummaryTool } from './stockSummary.js';
// import { registerOutstandingReceivablesTool } from './outstandingReceivables.js';
// import { registerOutstandingPayablesTool } from './outstandingPayables.js';
// import { registerCreateSalesVoucherTool } from './createSalesVoucher.js';
// import { registerCreatePurchaseVoucherTool } from './createPurchaseVoucher.js';
// import { registerCreatePaymentVoucherTool } from './createPaymentVoucher.js';
// import { registerCreateReceiptVoucherTool } from './createReceiptVoucher.js';
// import { registerCreateJournalVoucherTool } from './createJournalVoucher.js';
// import { registerGetVoucherDetailsTool } from './getVoucherDetails.js';
// import { registerGstReportTool } from './gstReport.js';
// import { registerBankReconciliationTool } from './bankReconciliation.js';
// import { registerAgeAnalysisTool } from './ageAnalysis.js';
// import { registerBudgetVsActualTool } from './budgetVsActual.js';
// import { registerBackupCompanyTool } from './backupCompany.js';
// import { registerAuditTrailTool } from './auditTrail.js';

export function registerAllTools(
	server: TallyMcpServer,
	httpClient: TallyHttpClient,
	xmlParser: TallyXmlParser
): void {
	const context: ToolContext = { httpClient, xmlParser };

	// Register implemented tools
	registerDayBookTool(server, context);
	registerLedgerVouchersTool(server, context);
	registerAllLedgersTool(server, context);
	registerCompanyInfoTool(server, context);
	registerAllGroupsTool(server, context);
	registerCreateLedgerTool(server, context);
	registerCreateStockItemTool(server, context);
	registerAllStockItemsTool(server, context);
	registerVoucherTypesTool(server, context);
	registerTrialBalanceTool(server, context);
	registerProfitLossTool(server, context);
	registerBalanceSheetTool(server, context);
	registerCashFlowTool(server, context);
	registerStockSummaryTool(server, context);
	registerOutstandingReceivablesTool(server, context);
	registerOutstandingPayablesTool(server, context);
	registerBankReconciliationTool(server, context);
	registerAgeAnalysisTool(server, context);
	registerBudgetVsActualTool(server, context);
	registerCreateSalesVoucherTool(server, context);
	registerCreatePurchaseVoucherTool(server, context);
	registerCreatePaymentVoucherTool(server, context);
	registerCreateReceiptVoucherTool(server, context);
	registerCreateJournalVoucherTool(server, context);
	registerGetVoucherDetailsTool(server, context);
	registerGstReportTool(server, context);
	registerAuditTrailTool(server, context);
	registerBackupCompanyTool(server, context);
	// registerBalanceSheetTool(server, context);
	// registerCashFlowTool(server, context);
	// registerStockSummaryTool(server, context);
	// registerOutstandingReceivablesTool(server, context);
	// registerOutstandingPayablesTool(server, context);
	// registerCreateSalesVoucherTool(server, context);
	// registerCreatePurchaseVoucherTool(server, context);
	// registerCreatePaymentVoucherTool(server, context);
	// registerCreateReceiptVoucherTool(server, context);
	// registerCreateJournalVoucherTool(server, context);
	// registerGetVoucherDetailsTool(server, context);
	// registerGstReportTool(server, context);
	// registerBankReconciliationTool(server, context);
	// registerAgeAnalysisTool(server, context);
	// registerBudgetVsActualTool(server, context);
	// registerBackupCompanyTool(server, context);
	// registerAuditTrailTool(server, context);
}
