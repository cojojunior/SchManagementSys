import { Users, ClipboardCheck, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  AcademicYearCard,
  AssessmentWeightCard,
  GradingScalesCard,
} from "@/features/dashboard/ConfigCards";
import { RecentActivity } from "@/features/dashboard/RecentActivity";
import { useDashboard } from "@/features/dashboard/useDashboard";

export default function HeadmasterDashboard() {
  const { summary, loading } = useDashboard();

  if (loading || !summary) {
    return (
      <>
        <PageHeader
          title="Headmaster"
          description="Review and publish results"
        />
        <div className="text-sm text-ink-500">Loading…</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Headmaster" description="Review and publish results" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
        <StatCard
          label="Students"
          value={summary.totalStudents}
          hint={`${summary.activeStudents} active`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Current term"
          value={summary.currentTermName ?? "Not set"}
          hint={summary.currentAcademicYear ?? ""}
          icon={<Calendar className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Results pipeline"
          value="Review in Results"
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <div className="mb-3">
        <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">
          School Configuration
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
        <AcademicYearCard summary={summary} basePath="/headmaster" />
        <AssessmentWeightCard summary={summary} />
        <GradingScalesCard summary={summary} basePath="/headmaster" />
      </div>

      <RecentActivity summary={summary} />
    </>
  );
}
