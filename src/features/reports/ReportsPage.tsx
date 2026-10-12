import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/features/auth/AuthContext";
import { useLookup } from "@/hooks/useLookup";
import { reportsService } from "@/services/supabase/reports";
import { academicYearsService } from "@/services/supabase/academic-years";
import { staffService } from "@/services/supabase/staff";
import type {
  EnrollmentReport,
  FinanceReport,
  PerformanceReport,
  TeacherReport,
} from "@/types/reports";
import { formatCurrency } from "@/lib/format";

const DIVISION_LABELS: Record<string, string> = {
  nursery: "Nursery",
  kg: "KG",
  primary: "Primary",
  jhs: "JHS",
  unknown: "Unknown",
};

const COLORS = ["#3b5bff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
  const { user } = useAuth();
  const [termId, setTermId] = useState("");
  const { data: terms } = useLookup(() => academicYearsService.listTerms());

  const [enrollment, setEnrollment] = useState<EnrollmentReport | null>(null);
  const [finance, setFinance] = useState<FinanceReport | null>(null);
  const [performance, setPerformance] = useState<PerformanceReport | null>(
    null,
  );
  const [teacherRows, setTeacherRows] = useState<TeacherReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Default to current term
  useEffect(() => {
    if (termId || terms.length === 0) return;
    const current = terms.find((t) => t.isCurrent) ?? terms[0];
    if (current) setTermId(current.id);
  }, [termId, terms]);

  // Load data based on role
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const role = user?.role;
      const isFinanceViewer =
        role === "super_admin" || role === "headmaster" || role === "secretary";
      const isEnrollmentViewer =
        role === "super_admin" || role === "headmaster" || role === "secretary";
      const isPerformanceViewer =
        role === "super_admin" || role === "headmaster" || role === "teacher";

      const tasks: Promise<void>[] = [];

      if (isEnrollmentViewer) {
        tasks.push(
          reportsService.enrollment().then((r) => {
            if (!cancelled) setEnrollment(r);
          }),
        );
      }

      if (isFinanceViewer) {
        tasks.push(
          reportsService.finance().then((r) => {
            if (!cancelled) setFinance(r);
          }),
        );
      }

      if (isPerformanceViewer && termId) {
        tasks.push(
          reportsService.performance(termId).then((r) => {
            if (!cancelled) setPerformance(r);
          }),
        );
      }

      if (role === "teacher" && user?.staffId) {
        tasks.push(
          reportsService.teacherOwn(user.staffId).then((r) => {
            if (!cancelled) setTeacherRows(r);
          }),
        );
      } else if (role === "teacher") {
        // Fallback: find staff by email
        const staff = await staffService.list({}, 1, 200);
        const me = staff.data.find((s) => s.email === user?.email);
        if (me) {
          const r = await reportsService.teacherOwn(me.id);
          if (!cancelled) setTeacherRows(r);
        }
      }

      await Promise.all(tasks);
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, termId]);

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Enrollment, performance, and finance analytics"
        action={
          <Select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="w-56">
            <option value="">Select term…</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.academicYearId}
              </option>
            ))}
          </Select>
        }
      />

      {/* Enrollment */}
      {enrollment && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <StatCard
              label="Total students"
              value={enrollment.totalStudents}
              hint={`${enrollment.activeStudents} active`}
              icon={<Users className="h-5 w-5" />}
              tone="brand"
            />
            {enrollment.byDivision.slice(0, 3).map((d) => (
              <StatCard
                key={d.division}
                label={DIVISION_LABELS[d.division] ?? d.division}
                value={d.count}
                hint="students"
                tone="sky"
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <Card>
              <CardHeader title="Enrollment by class" />
              <CardBody>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={enrollment.byClass}
                      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#eef0f4"
                      />
                      <XAxis
                        dataKey="className"
                        tick={{ fontSize: 12, fill: "#5c6675" }}
                        axisLine={{ stroke: "#dde1e8" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#5c6675" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#3b5bff"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Gender breakdown" />
              <CardBody>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={enrollment.byGender}
                        dataKey="count"
                        nameKey="gender"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}>
                        {enrollment.byGender.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* Finance */}
      {finance && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <StatCard
              label="Total billed"
              value={formatCurrency(finance.totalBilled)}
              icon={<Wallet className="h-5 w-5" />}
              tone="brand"
            />
            <StatCard
              label="Collected"
              value={formatCurrency(finance.totalCollected)}
              hint={`${finance.collectionRate}% of billed`}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(finance.totalOutstanding)}
              tone="amber"
            />
            <StatCard
              label="Collection rate"
              value={`${finance.collectionRate}%`}
              tone="sky"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <Card>
              <CardHeader title="Collections by division" />
              <CardBody className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">
                        Division
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium">
                        Billed
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium">
                        Collected
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium">
                        Outstanding
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {finance.byDivision.map((d) => (
                      <tr key={d.division}>
                        <td className="px-4 py-2 font-medium">
                          {DIVISION_LABELS[d.division] ?? d.division}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCurrency(d.billed)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                          {formatCurrency(d.collected)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-amber-700">
                          {formatCurrency(d.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Payment methods" />
              <CardBody className="p-0">
                <ul className="divide-y divide-ink-200">
                  {finance.byMethod.map((m) => (
                    <li
                      key={m.method}
                      className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {m.method}
                        </div>
                        <div className="text-xs text-ink-500">
                          {m.count} payment{m.count === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums">
                        {formatCurrency(m.amount)}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* Performance */}
      {performance && (
        <Card className="mb-6">
          <CardHeader
            title={`Performance — ${performance.termName} ${performance.academicYear}`}
            description={`Overall average: ${performance.overallAverage}%`}
          />
          <CardBody className="p-0">
            {performance.bySubject.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-500">
                No marks recorded for this term yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Subject
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      Average
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      Highest
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      Lowest
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {performance.bySubject.map((s) => (
                    <tr key={s.subjectId}>
                      <td className="px-4 py-2 font-medium">{s.subjectName}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold">
                        {s.average}%
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {s.highest}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {s.lowest}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-ink-500">
                        {s.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      )}

      {/* Teacher's own classes */}
      {teacherRows.length > 0 && (
        <Card>
          <CardHeader
            title="My classes"
            description={`${teacherRows.length} assignment${teacherRows.length === 1 ? "" : "s"}`}
          />
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Class</th>
                  <th className="text-left px-4 py-2.5 font-medium">Subject</th>
                  <th className="text-right px-4 py-2.5 font-medium">
                    Students
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">
                    Marks entered
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">
                    Average
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {teacherRows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-medium">{r.className}</td>
                    <td className="px-4 py-2">{r.subjectName}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.studentCount}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.marksEntered}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">
                      {r.classAverage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* Empty state */}
      {!enrollment && !finance && !performance && teacherRows.length === 0 && (
        <EmptyState title="No report data available for your role." />
      )}
    </>
  );
}
