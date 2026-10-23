import { useEffect, useState } from "react";
import {
  BookOpen,
  FileSpreadsheet,
  ClipboardCheck,
  School,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { useAuth } from "@/features/auth/AuthContext";
import { teachingAssignmentsService } from "@/services/supabase/teaching-assignments";
import type { TeachingAssignment } from "@/types/teaching-assignment";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { summary, loading } = useDashboard();
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Fetch the specific subjects/classes the teacher teaches
  useEffect(() => {
    if (!user?.id) return;
    teachingAssignmentsService
      .list({ teacherId: user.id }, 1, 100)
      .then((res) => setAssignments(res.data))
      .catch(console.error)
      .finally(() => setLoadingAssignments(false));
  }, [user?.id]);

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Subjects / Courses */}
        <Card>
          <CardHeader
            title="My Subjects"
            description="Courses and classes you are assigned to teach"
          />
          <CardBody className="p-0">
            {loadingAssignments ? (
              <div className="p-4 text-sm text-ink-500">
                Loading subjects...
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-4 text-sm text-ink-500">
                You have not been assigned any subjects yet. Please contact the
                administrator.
              </div>
            ) : (
              <ul className="divide-y divide-ink-200">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="p-4 flex items-center gap-3 hover:bg-ink-50/60">
                    <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 grid place-items-center shrink-0">
                      <School className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-900 truncate">
                        {a.subjectName}
                      </div>
                      <div className="text-xs text-ink-500">
                        {a.className} · {a.termName}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Quick Actions */}
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
      </div>
    </>
  );
}
