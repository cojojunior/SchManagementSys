import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Lock, Ticket } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCurrentStudent } from "@/features/auth/useCurrentStudent";
import { reportCardService } from "@/services/report-card";
import { academicYearsService } from "@/services/academic-years";
import { scratchCardsService } from "@/services/scratch-cards";
import type { ReportCardData } from "@/types/report-card";
import type { AcademicTerm } from "@/types/academic-year";
import { cn } from "@/lib/cn";

type UnlockedState = {
  unlocked: boolean;
  termId?: string;
  usesRemaining?: number;
};

export default function StudentResultsPage() {
  const { student, loading: studentLoading } = useCurrentStudent();
  const [pin, setPin] = useState("");
  const [termId, setTermId] = useState("");
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedState>({ unlocked: false });
  const [report, setReport] = useState<ReportCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Load terms once
  useEffect(() => {
    let cancelled = false;
    academicYearsService.listTerms().then((t) => {
      if (cancelled) return;
      setTerms(t);
      const current = t.find((x) => x.isCurrent) ?? t[0];
      if (current) setTermId(current.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRedeem() {
    if (!student || !pin || !termId) return;
    setVerifying(true);
    setError(null);
    try {
      const result = await scratchCardsService.redeem(pin, student.id);
      if (!result.ok) {
        setError(
          result.reason ??
            "Invalid or exhausted scratch card. Please check the PIN.",
        );
        return;
      }
      const data = await reportCardService.buildForStudent(student.id, termId);
      setReport(data);
      setUnlocked({
        unlocked: true,
        termId,
        usesRemaining: result.usesRemaining,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  if (studentLoading)
    return <div className="text-sm text-ink-500">Loading…</div>;
  if (!student) return <EmptyState title="Student record not found" />;

  if (!unlocked.unlocked) {
    return (
      <>
        <PageHeader
          title="My Results"
          description="Enter your scratch card PIN to unlock your results"
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Scratch card"
              description="A scratch card is required to view your results"
              action={<Lock className="h-5 w-5 text-ink-400" />}
            />
            <CardBody className="space-y-5">
              <div>
                <label className="text-sm font-medium text-ink-700 block mb-1.5">
                  Term
                </label>
                <select
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm">
                  <option value="">Select a term…</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.academicYearId}
                      {t.isCurrent ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-ink-700 block mb-1.5">
                  Scratch card PIN
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="8-digit PIN"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-lg tracking-widest text-center"
                  invalid={!!error}
                />
                <p className="text-xs text-ink-500 mt-1.5">
                  The PIN is on the back of your scratch card. Scratch gently to
                  reveal it.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleRedeem}
                disabled={verifying || pin.length < 6 || !termId}>
                <Ticket className="h-4 w-4" />
                {verifying ? "Verifying…" : "Unlock my results"}
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="How it works" />
            <CardBody className="space-y-3 text-sm text-ink-600">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Each card can unlock results a maximum of 3 times.</li>
                <li>Cards are valid for one term only.</li>
                <li>An expired or invalidated card will be rejected.</li>
                <li>
                  If you don&apos;t have a card, contact the school office.
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  const unlockedTerm = terms.find((t) => t.id === unlocked.termId);

  return (
    <>
      <PageHeader
        title="My Results"
        description={
          unlockedTerm
            ? `${student.className} · ${unlockedTerm.name} ${unlockedTerm.academicYearId}`
            : student.className
        }
        action={
          <Badge tone="success">
            <ClipboardCheck className="h-3 w-3" />
            Unlocked
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-ink-500">Total score</div>
          <div className="text-lg font-semibold tabular-nums mt-1">
            {report?.totals.totalScore ?? 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Average</div>
          <div className="text-lg font-semibold tabular-nums mt-1">
            {report?.totals.averageScore ?? 0}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Position</div>
          <div className="text-lg font-semibold tabular-nums mt-1">
            {report
              ? `${report.totals.position} / ${report.totals.classSize}`
              : "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Card uses left</div>
          <div className="text-lg font-semibold tabular-nums mt-1">
            {unlocked.usesRemaining ?? 0} / 3
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader title="Subject results" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Subject</th>
                  <th className="text-right px-4 py-2.5 font-medium">
                    Assessment
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">Exam</th>
                  <th className="text-right px-4 py-2.5 font-medium">Final</th>
                  <th className="text-left px-4 py-2.5 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {report?.subjects.map((r) => (
                  <tr key={r.subjectId}>
                    <td className="px-4 py-2 font-medium text-ink-900">
                      {r.subjectName}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.assessmentRaw ?? "—"} / {r.assessmentMax}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.examRaw ?? "—"} / {r.examMax}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">
                      {r.finalScore.toFixed(1)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center h-6 min-w-[1.75rem] px-2 rounded-md text-xs font-semibold",
                          gradeTone(r.grade),
                        )}>
                        {r.grade}
                      </span>
                      <span className="ml-2 text-xs text-ink-500">
                        {r.gradeLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/student/report">
          <Button className="w-full">View full report card</Button>
        </Link>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setUnlocked({ unlocked: false });
            setReport(null);
            setPin("");
          }}>
          Lock results again
        </Button>
      </div>
    </>
  );
}

function gradeTone(grade: string): string {
  if (["1", "2", "E", "VG"].includes(grade))
    return "bg-emerald-50 text-emerald-700";
  if (["3", "4", "5", "G"].includes(grade)) return "bg-sky-50 text-sky-700";
  if (["6", "7", "D"].includes(grade)) return "bg-amber-50 text-amber-700";
  if (["8", "9"].includes(grade)) return "bg-red-50 text-red-700";
  return "bg-ink-100 text-ink-600";
}
