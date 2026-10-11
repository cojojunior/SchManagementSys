import type { Invoice, Payment } from "@/types/finance";
import { invoicesService } from "./invoices";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export type FinanceSummary = {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  paidInvoices: number;
  partialInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  arrearsStudents: number; // distinct students with balance > 0
  monthlyCollections: Array<{ month: string; amount: number }>;
  methodBreakdown: Array<{ method: string; amount: number; count: number }>;
  topDebtors: Array<{
    studentId: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    balance: number;
  }>;
  recentPayments: Payment[];
};

export const financeDashboardService = {
  async summarize(): Promise<FinanceSummary> {
    await delay(300);

    // Pull all invoices and payments (mock data is small)
    const all = await invoicesService.list({}, 1, 500);
    const invoices: Invoice[] = all.data;
    const payments = await invoicesService.listAllPayments({});

    const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.paid, 0);
    const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0);

    const paidInvoices = invoices.filter((i) => i.status === "paid").length;
    const partialInvoices = invoices.filter(
      (i) => i.status === "partially_paid",
    ).length;
    const overdueInvoices = invoices.filter(
      (i) => i.status === "overdue",
    ).length;
    const unpaidInvoices = invoices.filter(
      (i) => i.status === "issued" || i.status === "overdue",
    ).length;

    // Arrears — distinct students with outstanding balance
    const arrearsMap = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.balance > 0) {
        arrearsMap.set(
          inv.studentId,
          (arrearsMap.get(inv.studentId) ?? 0) + inv.balance,
        );
      }
    }

    // Top debtors — aggregate balances
    const debtorMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        admissionNumber: string;
        className: string;
        balance: number;
      }
    >();
    for (const inv of invoices) {
      if (inv.balance <= 0) continue;
      const existing = debtorMap.get(inv.studentId);
      if (existing) {
        existing.balance += inv.balance;
      } else {
        debtorMap.set(inv.studentId, {
          studentId: inv.studentId,
          studentName: inv.studentName,
          admissionNumber: inv.admissionNumber,
          className: inv.className,
          balance: inv.balance,
        });
      }
    }
    const topDebtors = Array.from(debtorMap.values())
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    // Monthly collections (last 6 months)
    const byMonth = new Map<string, number>();
    for (const p of payments) {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount);
    }
    const monthlyCollections = Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 6)
      .reverse()
      .map(([month, amount]) => ({ month, amount }));

    // Method breakdown
    const byMethod = new Map<string, { amount: number; count: number }>();
    for (const p of payments) {
      const m = byMethod.get(p.method) ?? { amount: 0, count: 0 };
      m.amount += p.amount;
      m.count += 1;
      byMethod.set(p.method, m);
    }
    const methodBreakdown = Array.from(byMethod.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.amount - a.amount);

    const recentPayments = payments.slice(0, 5);

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      paidInvoices,
      partialInvoices,
      unpaidInvoices,
      overdueInvoices,
      arrearsStudents: arrearsMap.size,
      monthlyCollections,
      methodBreakdown,
      topDebtors,
      recentPayments,
    };
  },
};
