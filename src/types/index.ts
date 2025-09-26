// Tally API Types and Interfaces

export type TallyConfig = {
  url: string;
  timeout?: number;
};

export type TallyRequest = {
  envelope: {
    header: {
      tallyRequest: string;
    };
    body: {
      exportData?: {
        requestDesc: {
          reportName: string;
          staticVariables?: Record<string, string>;
        };
      };
      importData?: {
        requestDesc: {
          reportName: string;
        };
        requestData: {
          tallyMessage: any;
        };
      };
    };
  };
};

export type TallyResponse = {
  envelope?: {
    body?: {
      data?: any;
    };
  };
  // Raw XML response for parsing
  rawXml?: string;
};

// XML Parsing Types
export type ParsedXmlResult = {
  ENVELOPE?: {
    BODY?: {
      DATA?: any;
    };
  };
  [key: string]: any;
};

// Common Tally Entity Types
export type TallyLedger = {
  NAME?: string;
  OPENINGBALANCE?: string;
  CLOSINGBALANCE?: string;
  PARENT?: string;
};

export type TallyGroup = {
  NAME?: string;
  PARENT?: string;
};

export type TallyCompany = {
  NAME?: string;
};

export type TallyStockItem = {
  NAME?: string;
  BASEUNITS?: string;
  CLOSINGBALANCE?: string;
  CLOSINGRATE?: string;
  CLOSINGVALUE?: string;
};

export type TallyVoucher = {
  DATE?: string;
  VOUCHERTYPENAME?: string;
  VOUCHERNUMBER?: string;
  PARTYLEDGERNAME?: string;
  AMOUNT?: string;
  NARRATION?: string;
  VOUCHERTYPE?: string;
  VCHTYPE?: string;
  ACTION?: string;
  ALLLEDGERENTRIES?: {
    LIST?: Array<{
      LEDGERNAME?: string;
      AMOUNT?: string;
      ISDEEMEDPOSITIVE?: string;
    }>;
  };
};

export type TallyVoucherType = {
  NAME?: string;
  PARENT?: string;
};

export type TallyBill = {
  BILLDATE?: string;
  BILLNUMBER?: string;
  AMOUNT?: string;
};

// MCP Tool Parameter Types
export type DateRangeParams = {
  from_date: string; // DD-MM-YYYY format
  to_date: string; // DD-MM-YYYY format
};

export type LedgerParams = {
  ledger_name: string;
};

export type VoucherParams = {
  voucher_number: string;
  voucher_type: string;
};

export type CreateLedgerParams = {
  name: string;
  group: string;
  opening_balance?: number;
};

export type CreateStockItemParams = {
  name: string;
  unit: string;
  rate?: number;
};

export type CreateVoucherParams = {
  party: string;
  items?: string;
  amount: number;
  date: string; // DD-MM-YYYY format
  narration?: string;
};

export interface CreatePaymentParams extends CreateVoucherParams {
  payment_method?: string;
}

export interface CreateReceiptParams extends CreateVoucherParams {
  receipt_method?: string;
}

export type CreateJournalParams = {
  debit_ledger: string;
  credit_ledger: string;
  amount: number;
  date: string; // DD-MM-YYYY format
  narration: string;
};

export type BackupParams = {
  backup_path: string;
};

// Error Types
export type TallyApiError = {
  message: string;
  code?: string;
  details?: any;
};

// Response Types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: TallyApiError;
};

// Utility Types
export type TallyReportType =
  | "DayBook"
  | "Ledger Vouchers"
  | "List of Accounts"
  | "List of Companies"
  | "List of Accounts" // for groups
  | "List of Stock Items"
  | "List of Voucher Types"
  | "Trial Balance"
  | "Profit and Loss A/c"
  | "Balance Sheet"
  | "Cash Flow"
  | "Stock Summary"
  | "Receivables Outstanding"
  | "Payables Outstanding"
  | "Voucher Register"
  | "GST Returns Summary"
  | "Bank Reconciliation"
  | "Age Analysis"
  | "Budget vs Actual"
  | "Audit Trail";

export type VoucherType =
  | "Sales"
  | "Purchase"
  | "Payment"
  | "Receipt"
  | "Journal";

export type TallyRequestType = "Export Data" | "Import Data" | "Backup";

// Environment Types
export type EnvironmentConfig = {
  TALLY_URL: string;
  NODE_ENV?: "development" | "production";
  LOG_LEVEL?: "debug" | "info" | "warn" | "error";
};
