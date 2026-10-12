import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Award, Receipt, Percent, ArrowRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { RoleGate } from "@/features/auth/RoleGate";
import { assessmentWeightService } from "@/services/supabase/assessment-weight";
import type { DashboardSummary } from "@/services/supabase/dashboard";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

// ─────────────────────────────────────────────────────────────
// Academic Year card
// ─────────────────────────────────────────────────────────────

export function AcademicYearCard({
  summary,
  basePath,
}: {
  summary: DashboardSummary;
  basePath: string;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-600" />
            <span>Academic Year</span>
          </div>
        }
        action={
          <Link
            to={`${basePath}/academic-years`}
            className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      <CardBody className="space-y-3">
        <div>
          <div className="text-xs text-ink-500">Current year</div>
          <div className="text-lg font-semibold text-ink-900">
            {summary.currentAcademicYear ?? "Not set"}
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-500">Current term</div>
          <div className="text-sm font-medium text-ink-900">
            {summary.currentTermName ?? "Not set"}
          </div>
        </div>
        <div className="text-xs text-ink-500 pt-1 border-t border-ink-200">
          {summary.academicYearsCount} academic year
          {summary.academicYearsCount === 1 ? "" : "s"} configured
        </div>
      </CardBody>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Assessment Weights card (inline editable)
// ─────────────────────────────────────────────────────────────

export function AssessmentWeightCard({
  summary,
}: {
  summary: DashboardSummary;
}) {
  const [assessmentPercent, setAssessmentPercent] = useState(
    String(summary.assessmentPercent),
  );
  const [examPercent, setExamPercent] = useState(String(summary.examPercent));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAssessmentPercent(String(summary.assessmentPercent));
    setExamPercent(String(summary.examPercent));
  }, [summary.assessmentPercent, summary.examPercent]);

  const a = Number(assessmentPercent) || 0;
  const e = Number(examPercent) || 0;
  const total = a + e;
  const valid = total === 100;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await assessmentWeightService.update({
        assessmentPercent: a,
        examPercent: e,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-brand-600" />
            <span>Assessment Weights</span>
          </div>
        }
        action={
          <Link
            to="/admin/assessment-weight"
            className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
            Details <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Assessment %">
            <Input
              type="number"
              min={0}
              max={100}
              value={assessmentPercent}
              onChange={(ev) => setAssessmentPercent(ev.target.value)}
              invalid={total !== 100}
            />
          </FormField>
          <FormField label="Exam %">
            <Input
              type="number"
              min={0}
              max={100}
              value={examPercent}
              onChange={(ev) => setExamPercent(ev.target.value)}
              invalid={total !== 100}
            />
          </FormField>
        </div>

        <div
          className={cn(
            "flex items-center justify-between text-xs rounded-md px-3 py-2",
            total === 100
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          )}>
          <span>Total</span>
          <span className="font-semibold tabular-nums">{total}%</span>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        {saved && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            Saved
          </div>
        )}

        <RoleGate roles={["super_admin"]}>
          <Button
            size="sm"
            className="w-full"
            disabled={!valid || saving}
            onClick={handleSave}>
            {saving ? "Saving…" : "Save weights"}
          </Button>
        </RoleGate>
      </CardBody>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Grading Scales card
// ─────────────────────────────────────────────────────────────

export function GradingScalesCard({
  summary,
  basePath,
}: {
  summary: DashboardSummary;
  basePath: string;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-brand-600" />
            <span>Grading Scales</span>
          </div>
        }
        action={
          <Link
            to={`${basePath}/grading`}
            className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      <CardBody className="space-y-3">
        {summary.gradingScalesSummary.length === 0 ? (
          <p className="text-sm text-ink-500">No scales configured yet.</p>
        ) : (
          <ul className="space-y-2">
            {summary.gradingScalesSummary.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-ink-900">{s.name}</div>
                  <div className="text-xs text-ink-500 uppercase">
                    {s.divisions.join(" · ")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="text-xs text-ink-500 pt-2 border-t border-ink-200">
          {summary.gradingScalesCount} active scale
          {summary.gradingScalesCount === 1 ? "" : "s"}
        </div>
      </CardBody>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Fee Structures card
// ─────────────────────────────────────────────────────────────

const DIVISION_LABELS: Record<string, string> = {
  nursery: "Nursery",
  kg: "KG",
  primary: "Primary",
  jhs: "JHS",
};

export function FeeStructuresCard({
  summary,
  basePath,
}: {
  summary: DashboardSummary;
  basePath: string;
}) {
  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand-600" />
            <span>Fee Structures</span>
          </div>
        }
        action={
          <Link
            to={`${basePath}/fees`}
            className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      <CardBody className="space-y-3">
        {summary.feeStructuresSummary.length === 0 ? (
          <p className="text-sm text-ink-500">No fee structures yet.</p>
        ) : (
          <ul className="space-y-2">
            {summary.feeStructuresSummary.slice(0, 6).map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-700">
                  {DIVISION_LABELS[f.division] ?? f.division}
                </span>
                <span className="tabular-nums font-medium text-ink-900">
                  {formatCurrency(f.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="text-xs text-ink-500 pt-2 border-t border-ink-200">
          {summary.feeStructuresCount} active structure
          {summary.feeStructuresCount === 1 ? "" : "s"}
        </div>
      </CardBody>
    </Card>
  );
}
