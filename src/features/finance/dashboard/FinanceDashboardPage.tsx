import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Wallet,
  AlertCircle,
  Users,
  Receipt,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoleGate } from "@/features/auth/RoleGate";
import { useAuth } from "@/features/auth/AuthContext";
import {
  financeDashboardService,
  type FinanceSummary,
} from "@/services/finance-dashboard";
import { formatCurrency, formatDate } from "@/lib/format";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  momo: "Mobile Money",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  pos: "POS",
  other: "Other",
};

function roleBase(role: string | undefined): string {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "headmaster":
      return "/headmaster";
    case "secretary":
      return "/secretary";
    default:
      return "/admin";
  }
}

export default function FinanceDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const base = roleBase(user?.role);

  useEffect(() => {
    financeDashboardService.summarize().then((s) => {
      setSummary(s);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;
  if (!summary) return <EmptyState title="No finance data" />;

  const collectionRate =
    summary.totalBilled > 0
      ? Math.round((summary.totalCollected / summary.totalBilled) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title="Finance Overview"
        description="School-wide collections, outstanding balances, and recent activity"
        action={
          <RoleGate resource="invoices" action="create">
            <div className="flex items-center gap-2">
              <Link to={`${base}/invoices/new`}>
                <Button variant="secondary" size="sm">
                  <FileText className="h-4 w-4" />
                  New invoice
                </Button>
              </Link>
              <Link to={`${base}/invoices`}>
                <Button size="sm">
                  <Receipt className="h-4 w-4" />
                  All invoices
                </Button>
              </Link>
            </div>
          </RoleGate>
        }
      />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Total billed"
          value={formatCurrency(summary.totalBilled)}
          hint={`${summary.paidInvoices + summary.partialInvoices + summary.unpaidInvoices} invoices`}
          icon={<FileText className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Collected"
          value={formatCurrency(summary.totalCollected)}
          hint={
            <>
              <TrendingUp className="inline h-3 w-3 mr-0.5 -mt-0.5" />
              {collectionRate}% of billed
            </>
          }
          icon={<Wallet className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary.totalOutstanding)}
          hint={`${summary.unpaidInvoices} unpaid · ${summary.partialInvoices} partial`}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Arrears (students)"
          value={summary.arrearsStudents}
          hint={`${summary.overdueInvoices} overdue invoice${summary.overdueInvoices === 1 ? "" : "s"}`}
          icon={<Users className="h-5 w-5" />}
          tone="red"
        />
      </div>

      {/* Chart + method breakdown */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Monthly collections"
            description="Payments received in the last 6 months"
          />
          <CardBody>
            {summary.monthlyCollections.length === 0 ? (
              <div className="text-sm text-ink-500 text-center py-8">
                No payments recorded yet.
              </div>
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={summary.monthlyCollections.map((m) => ({
                      label: m.month,
                      amount: m.amount,
                    }))}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#eef0f4"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#5c6675" }}
                      axisLine={{ stroke: "#dde1e8" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#5c6675" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #dde1e8",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#3b5bff"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Payment methods" />
          <CardBody className="p-0">
            {summary.methodBreakdown.length === 0 ? (
              <div className="p-4 text-sm text-ink-500">No payments yet.</div>
            ) : (
              <ul className="divide-y divide-ink-200">
                {summary.methodBreakdown.map((m) => (
                  <li
                    key={m.method}
                    className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink-900">
                        {METHOD_LABELS[m.method] ?? m.method}
                      </div>
                      <div className="text-xs text-ink-500">
                        {m.count} payments
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-ink-900">
                      {formatCurrency(m.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Debtors + recent payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Top debtors"
            description="Students with the highest outstanding balance"
          />
          <CardBody className="p-0">
            {summary.topDebtors.length === 0 ? (
              <div className="p-6 text-sm text-ink-500 text-center">
                No outstanding balances — everyone is paid up.
              </div>
            ) : (
              <ul className="divide-y divide-ink-200">
                {summary.topDebtors.map((d) => (
                  <li
                    key={d.studentId}
                    className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`${base}/students/${d.studentId}/ledger`}
                        className="text-sm font-medium text-ink-900 hover:text-brand-600">
                        {d.studentName}
                      </Link>
                      <div className="text-xs text-ink-500">
                        {d.admissionNumber} · {d.className}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone="warning">Outstanding</Badge>
                      <span className="text-sm font-semibold tabular-nums text-amber-700">
                        {formatCurrency(d.balance)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent payments"
            action={
              <Link to={`${base}/payments`}>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            }
          />
          <CardBody className="p-0">
            {summary.recentPayments.length === 0 ? (
              <div className="p-6 text-sm text-ink-500 text-center">
                No payments recorded.
              </div>
            ) : (
              <ul className="divide-y divide-ink-200">
                {summary.recentPayments.map((p) => (
                  <li
                    key={p.id}
                    className="px-5 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink-900 truncate">
                        {p.studentName}
                      </div>
                      <div className="text-xs text-ink-500">
                        {p.paymentNumber} ·{" "}
                        {METHOD_LABELS[p.method] ?? p.method}
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        {formatDate(p.paidAt)} · {p.receivedBy}
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-emerald-700 shrink-0">
                      +{formatCurrency(p.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
