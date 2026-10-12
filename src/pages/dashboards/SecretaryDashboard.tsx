import { GraduationCap, CreditCard, AlertCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  AcademicYearCard,
  FeeStructuresCard,
} from "@/features/dashboard/ConfigCards";
import { RecentActivity } from "@/features/dashboard/RecentActivity";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { formatCurrency } from "@/lib/format";

export default function SecretaryDashboard() {
  const { summary, loading } = useDashboard();

  if (loading || !summary) {
    return (
      <>
        <PageHeader title="Secretary" description="Records and finances" />
        <div className="text-sm text-ink-500">Loading…</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Secretary" description="Records and finances" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Students"
          value={summary.totalStudents}
          hint={`${summary.activeStudents} active`}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Active staff"
          value={summary.activeStaff}
          icon={<Users className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Fees collected"
          value={formatCurrency(summary.feesCollected)}
          icon={<CreditCard className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary.feesOutstanding)}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <div className="mb-3">
        <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">
          School Configuration
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <AcademicYearCard summary={summary} basePath="/secretary" />
        <FeeStructuresCard summary={summary} basePath="/secretary" />
      </div>

      <RecentActivity summary={summary} />
    </>
  );
}
