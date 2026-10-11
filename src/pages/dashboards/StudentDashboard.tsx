import { Link } from "react-router-dom";
import {
  BookOpen,
  Ticket,
  CreditCard,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { useCurrentStudent } from "@/features/auth/useCurrentStudent";
import { formatCurrency } from "@/lib/format";

export default function StudentDashboard() {
  const { student, loading } = useCurrentStudent();

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;
  if (!student) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-ink-500">
            Your student record could not be found. Please contact the school
            office.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${student.firstName}`}
        description={`${student.className} · ${student.academicYear}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Current class"
          value={student.className}
          icon={<BookOpen className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Admission #"
          value={student.admissionNumber}
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label="Scratch card"
          value="2 / 3 uses left"
          hint="Term 1"
          icon={<Ticket className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Fees balance"
          value={formatCurrency(0)}
          hint="Term 1 2024/2025"
          icon={<CreditCard className="h-5 w-5" />}
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Quick actions" />
          <CardBody className="space-y-3">
            <Link to="/student/results" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <ClipboardCheck className="h-4 w-4" />
                View my results
              </Button>
            </Link>
            <Link to="/student/report" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <FileText className="h-4 w-4" />
                View my report card
              </Button>
            </Link>
            <Link to="/student/fees" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <CreditCard className="h-4 w-4" />
                Check my fees
              </Button>
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Term 1 results"
            action={<Badge tone="success">Published</Badge>}
          />
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Status</span>
              <span className="font-medium text-ink-900">Ready to view</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Access method</span>
              <span className="font-medium text-ink-900">Scratch card</span>
            </div>
            <p className="text-xs text-ink-500 pt-1">
              You need a valid scratch card to unlock your Term 1 results.
            </p>
            <Link to="/student/results">
              <Button className="w-full">
                <Ticket className="h-4 w-4" />
                Enter scratch card PIN
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
