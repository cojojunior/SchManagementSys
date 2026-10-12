import {
  BookOpen,
  ClipboardList,
  FileSpreadsheet,
  ClipboardCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/features/dashboard/useDashboard";

export default function TeacherDashboard() {
  const { summary, loading } = useDashboard();

  if (loading || !summary) {
    return (
      <>
        <PageHeader
          title="Teacher"
          description="Your classes and marks entry"
        />
        <div className="text-sm text-ink-500">Loading…</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Teacher"
        description={`${summary.currentTermName ?? ""} · ${summary.currentAcademicYear ?? ""}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Current term"
          value={summary.currentTermName ?? "Not set"}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          label="Assessments"
          value="View"
          hint="Marks entry open"
          icon={<FileSpreadsheet className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="My assignments"
          value="View"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Results"
          value="View"
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="emerald"
        />
      </div>

      <Card>
        <CardHeader title="Quick actions" />
        <CardBody className="space-y-3">
          <Link to="/teacher/assessments" className="block">
            <Button variant="secondary" className="w-full justify-start">
              <FileSpreadsheet className="h-4 w-4" />
              Enter marks
            </Button>
          </Link>
          <Link to="/teacher/assignments" className="block">
            <Button variant="secondary" className="w-full justify-start">
              <ClipboardList className="h-4 w-4" />
              View my assignments
            </Button>
          </Link>
          <Link to="/teacher/results" className="block">
            <Button variant="secondary" className="w-full justify-start">
              <ClipboardCheck className="h-4 w-4" />
              View my results
            </Button>
          </Link>
        </CardBody>
      </Card>
    </>
  );
}
