import { BookOpen, FileSpreadsheet, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { useAuth } from "@/features/auth/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { summary, loading } = useDashboard();

  if (loading || !summary) {
    return (
      <>
        <PageHeader
          title={`Welcome, ${user?.fullName || "Teacher"}!`}
          description="Loading your dashboard…"
        />
        <div className="text-sm text-ink-500">Loading…</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.fullName || "Teacher"}!`}
        description={`Welcome back! Manage your classes, assessments, and examination results from your dashboard.`}
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
          label="Final Exams"
          value="View"
          hint="Exam scores"
          icon={<ClipboardCheck className="h-5 w-5" />}
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
              Enter assessments (1st & 2nd CA)
            </Button>
          </Link>
          <Link to="/teacher/final-exams" className="block">
            <Button variant="secondary" className="w-full justify-start">
              <ClipboardCheck className="h-4 w-4" />
              Enter final exams
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
