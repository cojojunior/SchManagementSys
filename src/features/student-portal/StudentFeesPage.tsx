import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCurrentStudent } from "@/features/auth/useCurrentStudent";
import { invoicesService } from "@/services/invoices";
import type { Invoice, StudentLedger } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_TONE: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info" | "brand"
> = {
  draft: "neutral",
  issued: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

export default function StudentFeesPage() {
  const { student, loading: studentLoading } = useCurrentStudent();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ledger, setLedger] = useState<StudentLedger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    Promise.all([
      invoicesService.listForStudent(student.id),
      invoicesService.buildLedger(student.id),
    ]).then(([invs, led]) => {
      setInvoices(invs);
      setLedger(led);
      setLoading(false);
    });
  }, [student]);

  if (studentLoading || loading) {
    return <div className="text-sm text-ink-500">Loading…</div>;
  }

  if (!student) return <EmptyState title="Student record not found" />;

  return (
    <>
      <PageHeader
        title="My Fees"
        description={`${student.className} · ${student.academicYear}`}
      />

      {ledger && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card className="p-4">
            <div className="text-xs text-ink-500">Total billed</div>
            <div className="text-lg font-semibold tabular-nums mt-1">
              {formatCurrency(ledger.totals.billed)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-ink-500">Total paid</div>
            <div className="text-lg font-semibold text-emerald-700 tabular-nums mt-1">
              {formatCurrency(ledger.totals.paid)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-ink-500">Balance</div>
            <div className="text-lg font-semibold text-amber-700 tabular-nums mt-1">
              {formatCurrency(ledger.totals.balance)}
            </div>
          </Card>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader
          title="Invoices"
          description={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
        />
        <CardBody className="p-0">
          {invoices.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-500">
              <CreditCard className="h-6 w-6 text-ink-400 mx-auto mb-2" />
              No invoices yet for this term.
            </div>
          ) : (
            <ul className="divide-y divide-ink-200">
              {invoices.map((inv) => (
                <li key={inv.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-ink-500">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-sm font-medium text-ink-900 mt-0.5">
                        {inv.termName} · {inv.academicYear}
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        Issued {formatDate(inv.issueDate)} · Due{" "}
                        {formatDate(inv.dueDate)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold tabular-nums">
                        {formatCurrency(inv.total)}
                      </div>
                      <Badge
                        tone={STATUS_TONE[inv.status] ?? "neutral"}
                        className="mt-1">
                        {inv.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-ink-500">Paid</span>
                    <span className="tabular-nums text-emerald-700 font-medium">
                      {formatCurrency(inv.paid)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-ink-500">Balance</span>
                    <span className="tabular-nums text-amber-700 font-medium">
                      {formatCurrency(inv.balance)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {ledger && ledger.entries.length > 0 && (
        <Card>
          <CardHeader title="Transaction history" />
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium">
                    Description
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">Debit</th>
                  <th className="text-right px-4 py-2.5 font-medium">Credit</th>
                  <th className="text-right px-4 py-2.5 font-medium">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {ledger.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 text-ink-500">
                      {formatDate(e.date)}
                    </td>
                    <td className="px-4 py-2 text-ink-900">{e.description}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {e.debit > 0 ? formatCurrency(e.debit) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                      {e.credit > 0 ? formatCurrency(e.credit) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">
                      {formatCurrency(e.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </>
  );
}
