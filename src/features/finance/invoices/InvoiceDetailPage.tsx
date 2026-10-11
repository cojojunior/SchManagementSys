import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Printer } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoleGate } from "@/features/auth/RoleGate";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { invoicesService } from "@/services/supabase/invoices";
import type { Invoice, Payment } from "@/types/finance";
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

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  momo: "Mobile Money",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  pos: "POS",
  other: "Other",
};

export default function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);

  async function reload() {
    setLoading(true);
    const [inv, pays] = await Promise.all([
      invoicesService.get(id),
      invoicesService.listPayments(id),
    ]);
    setInvoice(inv);
    setPayments(pays);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        action={
          <Link to="..">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    );
  }

  const canRecordPayment =
    invoice.status !== "paid" &&
    invoice.status !== "void" &&
    invoice.balance > 0;

  return (
    <>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`${invoice.studentName} · ${invoice.className} · ${invoice.termName} ${invoice.academicYear}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            {canRecordPayment && (
              <RoleGate resource="payments" action="create">
                <Button size="sm" onClick={() => setPayOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Record payment
                </Button>
              </RoleGate>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-ink-500">Status</div>
          <div className="mt-1">
            <Badge tone={STATUS_TONE[invoice.status] ?? "neutral"}>
              {invoice.status.replace("_", " ")}
            </Badge>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Total</div>
          <div className="text-lg font-semibold tabular-nums mt-1">
            {formatCurrency(invoice.total)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Paid</div>
          <div className="text-lg font-semibold text-emerald-700 tabular-nums mt-1">
            {formatCurrency(invoice.paid)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Balance</div>
          <div className="text-lg font-semibold text-amber-700 tabular-nums mt-1">
            {formatCurrency(invoice.balance)}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Invoice items"
            description={`Issued ${formatDate(invoice.issueDate)} · Due ${formatDate(invoice.dueDate)}`}
          />
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Item</th>
                  <th className="text-left px-4 py-2.5 font-medium">
                    Category
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {invoice.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2 font-medium text-ink-900">
                      {l.name}
                    </td>
                    <td className="px-4 py-2 text-ink-600 capitalize">
                      {l.category.replace("_", " ")}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatCurrency(l.amount)}
                    </td>
                  </tr>
                ))}
                {invoice.discount > 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-right">
                      Discount
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-red-600">
                      −{formatCurrency(invoice.discount)}
                    </td>
                  </tr>
                )}
                <tr className="bg-ink-50">
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-lg">
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Payments"
            description={`${payments.length} recorded`}
          />
          <CardBody className="p-0">
            {payments.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-500">
                No payments yet.
              </div>
            ) : (
              <ul className="divide-y divide-ink-200">
                {payments.map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-900 tabular-nums">
                          {formatCurrency(p.amount)}
                        </div>
                        <div className="text-xs text-ink-500">
                          {METHOD_LABELS[p.method] ?? p.method}
                          {p.reference && ` · ${p.reference}`}
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5">
                          {formatDate(p.paidAt)} · {p.receivedBy}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-ink-400 shrink-0">
                        {p.paymentNumber}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <RecordPaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        invoice={invoice}
        onSaved={() => {
          setPayOpen(false);
          void reload();
        }}
      />
    </>
  );
}
