import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { invoicesService } from "@/services/supabase/invoices";
import type { StudentLedger } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/format";

export default function StudentLedgerPage() {
  const { id: studentId = "" } = useParams();
  const [ledger, setLedger] = useState<StudentLedger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    invoicesService.buildLedger(studentId).then((l) => {
      setLedger(l);
      setLoading(false);
    });
  }, [studentId]);

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;
  if (!ledger) {
    return (
      <EmptyState
        title="Student not found"
        action={
          <Link to="..">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`Statement — ${ledger.studentName}`}
        description={`${ledger.admissionNumber} · ${ledger.className}`}
        action={
          <Link to="..">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

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

      <Card>
        <CardHeader title="Transaction history" />
        <CardBody className="p-0">
          {ledger.entries.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Wallet className="h-6 w-6 text-ink-400 mx-auto mb-2" />
              <p className="text-sm text-ink-500">No transactions yet.</p>
            </div>
          ) : (
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
          )}
        </CardBody>
      </Card>
    </>
  );
}
