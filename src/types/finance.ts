import type { UUID, Division } from "./common";

export type FeeItemCategory =
  | "tuition"
  | "feeding"
  | "transport"
  | "books"
  | "uniform"
  | "result_access"
  | "other";

export type FeeItem = {
  id: UUID;
  name: string;
  category: FeeItemCategory;
  amount: number; // GHS
  description?: string;
};

export type FeeStructure = {
  id: UUID;
  name: string; // e.g. "JHS 2024/2025 Term 1"
  division: Division;
  classId?: UUID; // optional — if null, applies to whole division
  className?: string; // denormalized when classId is set
  academicYear: string;
  termId: UUID;
  termName: string; // denormalized
  items: FeeItem[];
  total: number; // sum of item amounts (computed)
  status: "active" | "inactive" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type FeeStructureFormValues = {
  name: string;
  division: Division;
  classId?: UUID;
  academicYear: string;
  termId: UUID;
  items: Array<Omit<FeeItem, "id">>;
  status: "active" | "inactive" | "archived";
};

export type FeeStructureFilters = {
  search?: string;
  division?: Division | "all";
  termId?: UUID | "all";
  status?: "active" | "inactive" | "archived" | "all";
};

// -------------------- Invoices & Payments --------------------

export type InvoiceStatus =
  "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "void";

export type InvoiceLine = {
  id: UUID;
  feeItemId?: UUID;
  name: string;
  category: FeeItemCategory;
  amount: number;
};

export type Invoice = {
  id: UUID;
  invoiceNumber: string; // e.g. INV-2024-0001
  studentId: UUID;
  studentName: string; // denormalized
  admissionNumber: string; // denormalized
  className: string; // denormalized
  academicYear: string;
  termId: UUID;
  termName: string; // denormalized
  feeStructureId?: UUID;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number; // computed from payments
  balance: number; // total - paid
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethod =
  "cash" | "momo" | "bank_transfer" | "cheque" | "pos" | "other";

export type Payment = {
  id: UUID;
  paymentNumber: string; // e.g. PAY-2024-0001
  invoiceId: UUID;
  studentId: UUID;
  studentName: string; // denormalized
  amount: number;
  method: PaymentMethod;
  reference?: string; // momo/bank ref
  receivedBy: string; // staff name
  paidAt: string; // ISO datetime
  notes?: string;
  createdAt: string;
};

export type PaymentFormValues = {
  invoiceId: UUID;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  notes?: string;
};

// -------------------- Invoice & Payment filters --------------------

export type InvoiceFilters = {
  search?: string;
  status?: InvoiceStatus | "all";
  termId?: UUID | "all";
  academicYear?: string | "all";
};

export type PaymentFilters = {
  search?: string;
  method?: PaymentMethod | "all";
  termId?: UUID | "all";
  dateFrom?: string;
  dateTo?: string;
};

// -------------------- Student ledger --------------------

export type LedgerEntry = {
  id: UUID;
  date: string;
  kind: "invoice" | "payment" | "adjustment";
  description: string;
  debit: number;    // amount added to student's debt (invoice)
  credit: number;   // amount paid (payment)
  balance: number;  // running balance after this entry
  referenceId?: UUID;
};

export type StudentLedger = {
  studentId: UUID;
  studentName: string;
  admissionNumber: string;
  className: string;
  termId?: UUID;
  entries: LedgerEntry[];
  totals: {
    billed: number;
    paid: number;
    balance: number;
  };
};