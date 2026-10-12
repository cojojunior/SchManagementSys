import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoleGate } from "@/features/auth/RoleGate";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { assessmentsService } from "@/services/supabase/assessments";
import { studentsService } from "@/services/supabase/student";
import { classesService } from "@/services/supabase/classes";
import { gradingService } from "@/services/supabase/grading";
import { assessmentWeightService } from "@/services/supabase/assessment-weight";
import { scoresService } from "@/services/supabase/scores";
import { calculateGrade } from "@/utils/grade-calculator";
import type { Assessment } from "@/types/assessment";
import type { GradingScale } from "@/types/grading";
import type { AssessmentWeight } from "@/types/assessment-weight";
import type { MarkEntryRow } from "@/types/score";
import { cn } from "@/lib/cn";

export default function MarkEntryPage() {
  const { id: assessmentId = "" } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [scale, setScale] = useState<GradingScale | null>(null);
  const [weight, setWeight] = useState<AssessmentWeight | null>(null);
  const [rows, setRows] = useState<MarkEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const asm = await assessmentsService.get(assessmentId);
      if (!asm || cancelled) {
        setLoading(false);
        return;
      }

      const cls = await classesService.get(asm.classId);
      const division = cls?.division ?? "primary";

      const [roster, existingScores, grading, w] = await Promise.all([
        studentsService.list(
          { classId: asm.classId, status: "active" },
          1,
          200,
        ),
        scoresService.listByAssessment(assessmentId),
        gradingService.getForDivision(division),
        assessmentWeightService.get(),
      ]);

      if (cancelled) return;
      if (!grading) {
        setLoading(false);
        return;
      }

      const scoreByStudent = new Map(
        existingScores.map((s) => [s.studentId, s]),
      );
      const initialRows: MarkEntryRow[] = roster.data.map((st) => {
        const existing = scoreByStudent.get(st.id);
        return {
          studentId: st.id,
          studentName: `${st.firstName} ${st.lastName}`,
          admissionNumber: st.admissionNumber,
          assessmentRaw: existing?.assessmentRaw ?? null,
          examRaw: existing?.examRaw ?? null,
          assessmentWeighted: existing?.assessmentWeighted ?? 0,
          examWeighted: existing?.examWeighted ?? 0,
          finalScore: existing?.finalScore ?? 0,
          grade: existing?.grade ?? "—",
          gradeLabel: existing?.gradeLabel ?? "—",
          remark: existing?.remark ?? "",
        };
      });

      setAssessment(asm);
      setScale(grading);
      setWeight(w);
      setRows(initialRows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const recalcRows = useCallback(
    (
      next: MarkEntryRow[],
      asm: Assessment,
      w: AssessmentWeight,
      s: GradingScale,
    ): MarkEntryRow[] => {
      return next.map((r) => {
        const calc = calculateGrade(
          r.assessmentRaw,
          r.examRaw,
          asm.maxAssessmentScore,
          asm.maxExamScore,
          w.assessmentPercent,
          w.examPercent,
          s,
        );
        const aw =
          r.assessmentRaw !== null && asm.maxAssessmentScore > 0
            ? Math.round(
                (r.assessmentRaw / asm.maxAssessmentScore) *
                  w.assessmentPercent *
                  100,
              ) / 100
            : 0;
        const ew =
          r.examRaw !== null && asm.maxExamScore > 0
            ? Math.round((r.examRaw / asm.maxExamScore) * w.examPercent * 100) /
              100
            : 0;
        return {
          ...r,
          assessmentWeighted: aw,
          examWeighted: ew,
          finalScore: calc.finalScore,
          grade: calc.grade,
          gradeLabel: calc.gradeLabel,
        };
      });
    },
    [],
  );

  function updateRow(studentId: string, patch: Partial<MarkEntryRow>) {
    if (!assessment || !weight || !scale) return;
    setRows((prev) => {
      const next = prev.map((r) =>
        r.studentId === studentId ? { ...r, ...patch } : r,
      );
      return recalcRows(next, assessment, weight, scale);
    });
    setSaved(false);
  }

  async function handleSave() {
    if (!assessment) return;
    setSaving(true);
    try {
      await scoresService.saveScores({ assessmentId: assessment.id, rows });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!assessment) return;
    setSubmitting(true);
    try {
      await scoresService.saveScores({ assessmentId: assessment.id, rows });
      await scoresService.updateStatus(assessment.id, "submitted");
      setConfirmSubmit(false);
      navigate("..");
    } finally {
      setSubmitting(false);
    }
  }

  const stats = useMemo(() => {
    const entered = rows.filter(
      (r) => r.assessmentRaw !== null && r.examRaw !== null,
    ).length;
    const avg =
      rows.length === 0
        ? 0
        : Math.round(
            (rows.reduce((sum, r) => sum + r.finalScore, 0) / rows.length) * 10,
          ) / 10;
    return { entered, total: rows.length, avg };
  }, [rows]);

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!assessment || !scale || !weight) {
    return (
      <EmptyState
        title="Assessment not found"
        action={
          <Link to="..">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`Mark Entry — ${assessment.className} · ${assessment.subjectName}`}
        description={`${assessment.termName} · ${assessment.academicYear} · Assessment /${assessment.maxAssessmentScore} · Exam /${assessment.maxExamScore}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <RoleGate resource="scores" action="update">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : saved ? "Saved" : "Save draft"}
              </Button>
            </RoleGate>
            <RoleGate resource="scores" action="update">
              <Button
                size="sm"
                onClick={() => setConfirmSubmit(true)}
                disabled={submitting || stats.entered !== stats.total}>
                <Send className="h-4 w-4" />
                Submit
              </Button>
            </RoleGate>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-4">
          <div className="text-xs text-ink-500">Progress</div>
          <div className="text-lg font-semibold text-ink-900 tabular-nums mt-1">
            {stats.entered} / {stats.total}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Class average (final)</div>
          <div className="text-lg font-semibold text-ink-900 tabular-nums mt-1">
            {stats.avg.toFixed(1)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Grade scale</div>
          <div className="text-lg font-semibold text-ink-900 mt-1 truncate">
            {scale.name}
          </div>
        </Card>
      </div>

      {stats.entered < stats.total && (
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <AlertCircle className="h-4 w-4" />
          {stats.total - stats.entered} student
          {stats.total - stats.entered === 1 ? "" : "s"} still missing marks.
          You must complete all entries before submitting.
        </div>
      )}

      {saved && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4" />
          Draft saved.
        </div>
      )}

      <Card>
        <CardHeader
          title="Marks"
          description={`Weighted: Assessment ${weight.assessmentPercent}% + Exam ${weight.examPercent}% = 100%`}
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">#</th>
                  <th className="text-left px-4 py-2.5 font-medium">Student</th>
                  <th className="text-left px-4 py-2.5 font-medium">
                    Admission #
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium w-32">
                    Assessment /{assessment.maxAssessmentScore}
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium w-32">
                    Exam /{assessment.maxExamScore}
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">Final</th>
                  <th className="text-left px-4 py-2.5 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-ink-500">
                      No students enrolled in this class yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => {
                    const invalidA =
                      r.assessmentRaw !== null &&
                      (r.assessmentRaw < 0 ||
                        r.assessmentRaw > assessment.maxAssessmentScore);
                    const invalidE =
                      r.examRaw !== null &&
                      (r.examRaw < 0 || r.examRaw > assessment.maxExamScore);
                    return (
                      <tr key={r.studentId} className="hover:bg-ink-50/60">
                        <td className="px-4 py-2 text-ink-400 tabular-nums">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2 font-medium text-ink-900">
                          {r.studentName}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-ink-500">
                          {r.admissionNumber}
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min={0}
                            max={assessment.maxAssessmentScore}
                            step={1}
                            value={r.assessmentRaw ?? ""}
                            invalid={invalidA}
                            onChange={(e) =>
                              updateRow(r.studentId, {
                                assessmentRaw:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                            className="h-9 w-24"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min={0}
                            max={assessment.maxExamScore}
                            step={1}
                            value={r.examRaw ?? ""}
                            invalid={invalidE}
                            onChange={(e) =>
                              updateRow(r.studentId, {
                                examRaw:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                            className="h-9 w-24"
                          />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold text-ink-900">
                          {r.finalScore.toFixed(1)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-7 min-w-[2rem] px-2 rounded-md text-sm font-semibold",
                                gradeTone(r.grade),
                              )}>
                              {r.grade}
                            </span>
                            <span className="text-xs text-ink-500 truncate">
                              {r.gradeLabel}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between mt-6">
        <p className="text-xs text-ink-500">
          Grades calculated automatically from the configured grading scale.
          Final scores are rounded half-up to the nearest whole for grade
          lookup.
        </p>
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={handleSubmit}
        loading={submitting}
        title="Submit marks for review?"
        message="Once submitted, marks are sent to the Headmaster for review. You will not be able to edit them until they are returned for correction."
        confirmLabel="Submit"
      />
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
