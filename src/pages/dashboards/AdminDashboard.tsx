import { Users, GraduationCap, CreditCard, Ticket } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  AcademicYearCard,
  AssessmentWeightCard,
  GradingScalesCard,
  FeeStructuresCard,
} from "@/features/dashboard/ConfigCards";
import { RecentActivity } from "@/features/dashboard/RecentActivity";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { formatCurrency } from "@/lib/format";

export default function AdminDashboard() {
  const { summary, loading } = useDashboard();

  if (loading || !summary) {
    return (
      <>
        <PageHeader
          title="Super Admin"
          description="Overview of Supreme Academy"
        />
        <div className="text-sm text-ink-500">Loading…</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Super Admin"
        description="Overview of Supreme Academy"
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Total students"
          value={summary.totalStudents}
          hint={`${summary.activeStudents} active`}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Active staff"
          value={summary.activeStaff}
          hint={`${summary.totalStaff} total`}
          icon={<Users className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Fees collected (current term)"
          value={formatCurrency(summary.feesCollected)}
          hint={`${formatCurrency(summary.feesOutstanding)} outstanding`}
          icon={<CreditCard className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Scratch cards"
          value={summary.scratchCardsSold}
          hint="Generated total"
          icon={<Ticket className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {/* Config cards */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">
          School Configuration
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <AcademicYearCard summary={summary} basePath="/admin" />
        <AssessmentWeightCard summary={summary} />
        <GradingScalesCard summary={summary} basePath="/admin" />
        <FeeStructuresCard summary={summary} basePath="/admin" />
      </div>

      {/* Recent activity */}
      <RecentActivity summary={summary} />
    </>
  );
}
