import { requireSupabase } from "@/lib/supabase";
import { pickOne } from "@/lib/pick-one";
import type {
  Invoice,
  InvoiceFilters,
  InvoiceStatus,
  PaymentMethod,
  StudentLedger,
  LedgerEntry,
} from "@/types/finance";
import type { Paginated } from "@/types/common";
import { feeStructuresService } from "./fee-structures";

// ---------- Row shapes as they arrive from Supabase ----------

type Joined<T> = T | T[] | null;

type DbInvoice = {
  id: string;
  invoice_number: string;
  student_id: string;
  academic_year: string;
  term_id: string;
  fee_structure_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  students?: Joined<{
    first_name: string;
    last_name: string;
    admission_number: string;
    class_id: string | null;
    classes: Joined<{ name: string }>;
  }>;
  terms?: Joined<{ name: string }>;
  invoice_lines?: DbInvoiceLine[];
};

type DbInvoiceLine = {
  id: string;
  invoice_id: string;
  name: string;
  category: string;
  amount: number;
  order_index: number;
};

type DbPayment = {
  id: string;
  payment_number: string;
  invoice_id: string;
  student_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  received_by: string | null;
  paid_at: string;
  notes: string | null;
  created_at: string;
  students?: Joined<{ first_name: string; last_name: string }>;
  profiles?: Joined<{ full_name: string }>;
};

const INVOICE_SELECT = `
  *,
  students(first_name, last_name, admission_number, class_id, classes(name)),
  terms(name),
  invoice_lines(*)
`;

const PAYMENT_SELECT = `
  *,
  students(first_name, last_name),
  profiles!received_by(full_name)
`;

// ---------- Domain mappers ----------

function toInvoice(row: DbInvoice): Invoice {
  const st = pickOne(row.students);
  const cls = st ? pickOne(st.classes) : null;
  const term = pickOne(row.terms);

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    studentId: row.student_id,
    studentName: st ? `${st.first_name} ${st.last_name}` : "Unknown",
    admissionNumber: st?.admission_number ?? "—",
    className: cls?.name ?? "—",
    academicYear: row.academic_year,
    termId: row.term_id,
    termName: term?.name ?? "—",
    feeStructureId: row.fee_structure_id ?? undefined,
    lines: (row.invoice_lines ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((l) => ({
        id: l.id,
        name: l.name,
        category: l.category as Invoice["lines"][number]["category"],
        amount: Number(l.amount),
      })),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    paid: Number(row.paid),
    balance: Number(row.balance),
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPayment(row: DbPayment) {
  const st = pickOne(row.students);
  const prof = pickOne(row.profiles);
  return {
    id: row.id,
    paymentNumber: row.payment_number,
    invoiceId: row.invoice_id,
    studentId: row.student_id,
    studentName: st ? `${st.first_name} ${st.last_name}` : "Unknown",
    amount: Number(row.amount),
    method: row.method,
    reference: row.reference ?? undefined,
    receivedBy: prof?.full_name ?? "—",
    paidAt: row.paid_at,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export const invoicesService = {
  async list(
    filters: InvoiceFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Invoice>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("invoices")
      .select(INVOICE_SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.search) {
      query = query.ilike("invoice_number", `%${filters.search}%`);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.termId && filters.termId !== "all") {
      query = query.eq("term_id", filters.termId);
    }
    if (filters.academicYear && filters.academicYear !== "all") {
      query = query.eq("academic_year", filters.academicYear);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbInvoice[]).map(toInvoice),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Invoice | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toInvoice(data as unknown as DbInvoice) : null;
  },

  async listForStudent(studentId: string): Promise<Invoice[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("student_id", studentId)
      .order("issue_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as DbInvoice[]).map(toInvoice);
  },

  async generateForStudent(
    studentId: string,
    termId: string,
  ): Promise<Invoice> {
    const supabase = requireSupabase();

    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("student_id", studentId)
      .eq("term_id", termId)
      .maybeSingle();
    if (existing) return (await this.get(existing.id))!;

    const { data: student } = await supabase
      .from("students")
      .select("id, first_name, last_name, division, class_id, academic_year")
      .eq("id", studentId)
      .single();
    if (!student) throw new Error("Student not found");

    const structure = await feeStructuresService.findForStudent(
      student.division,
      student.class_id ?? undefined,
      termId,
      student.academic_year,
    );
    if (!structure) {
      throw new Error(
        "No active fee structure matches this student's division and term.",
      );
    }

    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true });
    const next = (count ?? 0) + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(next).padStart(4, "0")}`;

    const subtotal = structure.items.reduce((s, i) => s + i.amount, 0);
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        student_id: studentId,
        academic_year: student.academic_year,
        term_id: termId,
        fee_structure_id: structure.id,
        subtotal,
        discount: 0,
        total: subtotal,
        paid: 0,
        balance: subtotal,
        status: "issued",
        issue_date: today,
        due_date: due,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("invoice_lines").insert(
      structure.items.map((i, idx) => ({
        invoice_id: invoice.id,
        name: i.name,
        category: i.category,
        amount: i.amount,
        order_index: idx + 1,
      })),
    );

    return (await this.get(invoice.id))!;
  },

  async generateForClass(
    classId: string,
    termId: string,
  ): Promise<{ created: number; skipped: number; failed: number }> {
    const supabase = requireSupabase();
    const { data: roster } = await supabase
      .from("students")
      .select("id")
      .eq("class_id", classId)
      .eq("status", "active");

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const st of (roster ?? []) as { id: string }[]) {
      const { data: existing } = await supabase
        .from("invoices")
        .select("id")
        .eq("student_id", st.id)
        .eq("term_id", termId)
        .maybeSingle();
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

  async recordPayment(
    invoiceId: string,
    amount: number,
    method: string,
    reference: string | undefined,
    _receivedBy: string,
    paidAt: string,
    notes?: string,
  ) {
    const supabase = requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: inv } = await supabase
      .from("invoices")
      .select("id, student_id, balance, invoice_number")
      .eq("id", invoiceId)
      .single();
    if (!inv) throw new Error("Invoice not found");
    if (amount <= 0) throw new Error("Payment amount must be greater than 0");
    if (amount > Number(inv.balance)) {
      throw new Error(`Payment exceeds remaining balance of ${inv.balance}.`);
    }

    const { count } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true });
    const next = (count ?? 0) + 1;
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        payment_number: paymentNumber,
        invoice_id: invoiceId,
        student_id: inv.student_id,
        amount,
        method,
        reference: reference ?? null,
        received_by: user?.id ?? null,
        paid_at: paidAt,
        notes: notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return payment;
  },

  async listPayments(invoiceId: string) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("invoice_id", invoiceId)
      .order("paid_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as DbPayment[]).map(toPayment);
  },

  async listAllPayments(
    filters: {
      search?: string;
      method?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const supabase = requireSupabase();
    let query = supabase
      .from("payments")
      .select(PAYMENT_SELECT)
      .order("paid_at", { ascending: false });

    if (filters.search) {
      query = query.ilike("payment_number", `%${filters.search}%`);
    }
    if (filters.method && filters.method !== "all") {
      query = query.eq("method", filters.method);
    }
    if (filters.dateFrom) {
      query = query.gte("paid_at", filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte("paid_at", filters.dateTo + "T23:59:59Z");
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as unknown as DbPayment[]).map(toPayment);
  },

  async buildLedger(studentId: string): Promise<StudentLedger | null> {
    const supabase = requireSupabase();

    const { data: student } = await supabase
      .from("students")
      .select("id, first_name, last_name, admission_number, classes(name)")
      .eq("id", studentId)
      .maybeSingle();
    if (!student) return null;

    const [invoicesRes, paymentsRes] = await Promise.all([
      supabase
        .from("invoices")
        .select(
          "id, invoice_number, issue_date, total, term_id, terms(name), academic_year",
        )
        .eq("student_id", studentId),
      supabase
        .from("payments")
        .select("id, payment_number, paid_at, amount, method, reference")
        .eq("student_id", studentId),
    ]);

    type RawInvoice = {
      id: string;
      invoice_number: string;
      issue_date: string;
      total: number;
      academic_year: string;
      terms: Joined<{ name: string }>;
    };

    type RawPayment = {
      id: string;
      payment_number: string;
      paid_at: string;
      amount: number;
      method: string;
      reference: string | null;
    };

    type ChronoEntry =
      | { kind: "invoice"; date: string; invoice: RawInvoice }
      | { kind: "payment"; date: string; payment: RawPayment };

    const chrono: ChronoEntry[] = [];

    for (const inv of (invoicesRes.data ?? []) as unknown as RawInvoice[]) {
      chrono.push({ kind: "invoice", date: inv.issue_date, invoice: inv });
    }
    for (const pay of (paymentsRes.data ?? []) as unknown as RawPayment[]) {
      chrono.push({ kind: "payment", date: pay.paid_at, payment: pay });
    }

    chrono.sort((a, b) => (a.date < b.date ? -1 : 1));

    let balance = 0;
    let billed = 0;
    let paid = 0;
    const entries: LedgerEntry[] = [];

    for (const e of chrono) {
      if (e.kind === "invoice") {
        const term = pickOne(e.invoice.terms);
        balance += Number(e.invoice.total);
        billed += Number(e.invoice.total);
        entries.push({
          id: `le-${e.invoice.id}`,
          date: e.invoice.issue_date,
          kind: "invoice",
          description: `${e.invoice.invoice_number} — ${term?.name ?? ""} ${e.invoice.academic_year}`,
          debit: Number(e.invoice.total),
          credit: 0,
          balance,
          referenceId: e.invoice.id,
        });
      } else {
        balance -= Number(e.payment.amount);
        paid += Number(e.payment.amount);
        entries.push({
          id: `le-${e.payment.id}`,
          date: e.payment.paid_at.slice(0, 10),
          kind: "payment",
          description: `${e.payment.payment_number} — ${e.payment.method.toUpperCase()}${e.payment.reference ? ` (${e.payment.reference})` : ""}`,
          debit: 0,
          credit: Number(e.payment.amount),
          balance,
          referenceId: e.payment.id,
        });
      }
    }

    const cls = pickOne(
      (student as unknown as { classes?: Joined<{ name: string }> }).classes,
    );

    return {
      studentId: student.id,
      studentName: `${student.first_name} ${student.last_name}`,
      admissionNumber: student.admission_number,
      className: cls?.name ?? "—",
      entries,
      totals: { billed, paid, balance },
    };
  },
};
