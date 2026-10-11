import { useEffect, useState } from "react";
import { Search, Banknote } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TableEmpty,
} from "@/components/ui/Table";
import { invoicesService } from "@/services/supabase/invoices";
import type { Payment } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/format";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  momo: "Mobile Money",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  pos: "POS",
  other: "Other",
};

export default function PaymentListPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    invoicesService
      .listAllPayments({ search, method, dateFrom, dateTo })
      .then((res) => {
        if (!cancelled) setPayments(res);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, method, dateFrom, dateTo]);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Payments"
        description={`${payments.length} payments · Total ${formatCurrency(total)}`}
      />

      <Card>
        <div className="p-4 border-b border-ink-200 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search by payment #, student, reference…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="lg:w-44">
            <option value="all">All methods</option>
            <option value="cash">Cash</option>
            <option value="momo">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="pos">POS</option>
            <option value="other">Other</option>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="lg:w-40"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="lg:w-40"
          />
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Payment #</TH>
              <TH>Student</TH>
              <TH>Method</TH>
              <TH>Reference</TH>
              <TH>Date</TH>
              <TH>Received by</TH>
              <TH className="text-right">Amount</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={7}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : payments.length === 0 ? (
              <TableEmpty colSpan={7}>
                <div className="flex flex-col items-center gap-2">
                  <Banknote className="h-6 w-6 text-ink-400" />
                  <span>No payments match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              payments.map((p) => (
                <TR key={p.id}>
                  <TD className="font-mono text-xs">{p.paymentNumber}</TD>
                  <TD className="font-medium text-ink-900">{p.studentName}</TD>
                  <TD>
                    <Badge tone="info">
                      {METHOD_LABELS[p.method] ?? p.method}
                    </Badge>
                  </TD>
                  <TD className="font-mono text-xs text-ink-500">
                    {p.reference ?? "—"}
                  </TD>
                  <TD className="text-ink-500">{formatDate(p.paidAt)}</TD>
                  <TD className="text-ink-600">{p.receivedBy}</TD>
                  <TD className="text-right tabular-nums font-semibold">
                    {formatCurrency(p.amount)}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
