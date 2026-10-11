import type {
  Invoice,
  InvoiceFilters,
  InvoiceStatus,
  StudentLedger,
  LedgerEntry,
} from "@/types/finance";
import type { Paginated } from "@/types/common";
import { MOCK_INVOICES } from "./mock/invoices";
import { MOCK_PAYMENTS } from "./mock/invoices";
import { studentsService } from "./students";
import { academicYearsService } from "./academic-years";
import { feeStructuresService } from "./fee-structure";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let invoices: Invoice[] = [...MOCK_INVOICES];
let payments = [...MOCK_PAYMENTS];

function computeStatus(inv: Invoice): InvoiceStatus {
  if (inv.status === "void") return "void";
  if (inv.paid >= inv.total) return "paid";
  if (inv.paid > 0) return "partially_paid";
  const now = new Date();
  const due = new Date(inv.dueDate);
  if (now > due) return "overdue";
  return "issued";
}

function refreshInvoiceStatus(inv: Invoice): Invoice {
  const paid = payments
    .filter((p) => p.invoiceId === inv.id)
    .reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, inv.total - paid);
  const updated = { ...inv, paid, balance };
  return { ...updated, status: computeStatus(updated) };
}

function matches(inv: Invoice, f: InvoiceFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay =
      `${inv.invoiceNumber} ${inv.studentName} ${inv.admissionNumber} ${inv.className}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.status && f.status !== "all" && inv.status !== f.status) return false;
  if (f.termId && f.termId !== "all" && inv.termId !== f.termId) return false;
  if (
    f.academicYear &&
    f.academicYear !== "all" &&
    inv.academicYear !== f.academicYear
  )
    return false;
  return true;
}

export const invoicesService = {
  async list(
    filters: InvoiceFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Invoice>> {
    await delay();
    const refreshed = invoices.map(refreshInvoiceStatus);
    const filtered = refreshed.filter((i) => matches(i, filters));
    const start = (page - 1) * pageSize;
    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Invoice | null> {
    await delay(150);
    const inv = invoices.find((i) => i.id === id);
    return inv ? refreshInvoiceStatus(inv) : null;
  },

  async listForStudent(studentId: string): Promise<Invoice[]> {
    await delay();
    return invoices
      .filter((i) => i.studentId === studentId)
      .map(refreshInvoiceStatus)
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  },

  /** Auto-generate an invoice for (student, term) from the matching fee structure. */
  async generateForStudent(
    studentId: string,
    termId: string,
  ): Promise<Invoice> {
    await delay(400);

    const student = await studentsService.get(studentId);
    if (!student) throw new Error("Student not found");

    const term = await academicYearsService.getTerm(termId);
    if (!term) throw new Error("Term not found");

    const year = await academicYearsService.getYear(term.academicYearId);
    const academicYear = year?.name ?? "—";

    // Already exists?
    const existing = invoices.find(
      (i) => i.studentId === studentId && i.termId === termId,
    );
    if (existing) return refreshInvoiceStatus(existing);

    const structure = await feeStructuresService.findForStudent(
      student.division,
      student.classId,
      termId,
      academicYear,
    );
    if (!structure) {
      throw new Error(
        "No active fee structure matches this student's division and term.",
      );
    }

    const seq = String(invoices.length + 1).padStart(4, "0");
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const lines = structure.items.map((it, idx) => ({
      id: `il-${Date.now()}-${idx}`,
      name: it.name,
      category: it.category,
      amount: it.amount,
    }));
    const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${seq}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      className: student.className,
      academicYear,
      termId,
      termName: term.name,
      feeStructureId: structure.id,
      lines,
      subtotal,
      discount: 0,
      total: subtotal,
      paid: 0,
      balance: subtotal,
      status: "issued",
      issueDate: today,
      dueDate,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    invoices = [invoice, ...invoices];
    return invoice;
  },

  /** Bulk-generate invoices for every active student in a class for a term. */
  async generateForClass(
    classId: string,
    termId: string,
  ): Promise<{ created: number; skipped: number; failed: number }> {
    await delay(600);
    const roster = await studentsService.list(
      { classId, status: "active" },
      1,
      500,
    );
    let created = 0;
    let skipped = 0;
    let failed = 0;
    for (const st of roster.data) {
      const existing = invoices.find(
        (i) => i.studentId === st.id && i.termId === termId,
      );
      if (existing) {
        skipped++;
        continue;
      }
      try {
        await this.generateForStudent(st.id, termId);
        created++;
      } catch {
        failed++;
      }
    }
    return { created, skipped, failed };
  },

  /** Record a payment and update the invoice. */
  async recordPayment(
    invoiceId: string,
    amount: number,
    method: string,
    reference: string | undefined,
    receivedBy: string,
    paidAt: string,
    notes?: string,
  ) {
    await delay(350);
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");
    if (amount <= 0) throw new Error("Payment amount must be greater than 0");
    const current = refreshInvoiceStatus(inv);
    if (amount > current.balance) {
      throw new Error(
        `Payment exceeds remaining balance of ${current.balance}.`,
      );
    }

    const seq = String(payments.length + 1).padStart(4, "0");
    const nowIso = new Date().toISOString();
    const payment = {
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-${new Date().getFullYear()}-${seq}`,
      invoiceId,
      studentId: inv.studentId,
      studentName: inv.studentName,
      amount,
      method: method as any,
      reference,
      receivedBy,
      paidAt,
      notes,
      createdAt: nowIso,
    };
    payments = [payment, ...payments];

    const idx = invoices.findIndex((i) => i.id === invoiceId);
    invoices[idx] = refreshInvoiceStatus(invoices[idx]);

    return payment;
  },

  async listPayments(invoiceId: string) {
    await delay(150);
    return payments.filter((p) => p.invoiceId === invoiceId);
  },

  async listAllPayments(
    filters: {
      search?: string;
      method?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    await delay();
    let result = [...payments];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) =>
        `${p.paymentNumber} ${p.studentName} ${p.reference ?? ""}`
          .toLowerCase()
          .includes(q),
      );
    }
    if (filters.method && filters.method !== "all") {
      result = result.filter((p) => p.method === filters.method);
    }
    if (filters.dateFrom) {
      result = result.filter((p) => p.paidAt >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((p) => p.paidAt <= filters.dateTo! + "T23:59:59Z");
    }

    return result.sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  },

  /** Build a full ledger for a student. */
  async buildLedger(studentId: string): Promise<StudentLedger | null> {
    await delay(300);
    const student = await studentsService.get(studentId);
    if (!student) return null;

    const studentInvoices = invoices
      .filter((i) => i.studentId === studentId)
      .map(refreshInvoiceStatus)
      .sort((a, b) => (a.issueDate > b.issueDate ? 1 : -1));

    const entries: LedgerEntry[] = [];
    let balance = 0;

    const chronological: Array<{
      date: string;
      kind: "invoice" | "payment";
      inv?: Invoice;
      pay?: (typeof payments)[number];
    }> = [];

    for (const inv of studentInvoices) {
      chronological.push({ date: inv.issueDate, kind: "invoice", inv });
    }
    for (const p of payments.filter((x) => x.studentId === studentId)) {
      chronological.push({ date: p.paidAt, kind: "payment", pay: p });
    }
    chronological.sort((a, b) => (a.date < b.date ? -1 : 1));

    let billed = 0;
    let paid = 0;

    for (const e of chronological) {
      if (e.kind === "invoice" && e.inv) {
        balance += e.inv.total;
        billed += e.inv.total;
        entries.push({
          id: `le-${e.inv.id}`,
          date: e.inv.issueDate,
          kind: "invoice",
          description: `${e.inv.invoiceNumber} — ${e.inv.termName} ${e.inv.academicYear}`,
          debit: e.inv.total,
          credit: 0,
          balance,
          referenceId: e.inv.id,
        });
      } else if (e.kind === "payment" && e.pay) {
        balance -= e.pay.amount;
        paid += e.pay.amount;
        entries.push({
          id: `le-${e.pay.id}`,
          date: e.pay.paidAt.slice(0, 10),
          kind: "payment",
          description: `${e.pay.paymentNumber} — ${e.pay.method.toUpperCase()}${e.pay.reference ? ` (${e.pay.reference})` : ""}`,
          debit: 0,
          credit: e.pay.amount,
          balance,
          referenceId: e.pay.id,
        });
      }
    }

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      className: student.className,
      entries,
      totals: { billed, paid, balance },
    };
  },
};
