import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Send,
  Lock,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { RoleGate } from "@/features/auth/RoleGate";
import { useAuth } from "@/features/auth/AuthContext";
import { resultsService } from "@/services/supabase/results";
import { scoresService } from "@/services/supabase/scores";
import type { AssessmentResult, ResultChangeLog } from "@/types/result";
import type { Score } from "@/types/score";
import { cn } from "@/lib/cn";

export default function ResultReviewPage() {
  const { id: assessmentId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [log, setLog] = useState<ResultChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [confirmAction, setConfirmAction] = useState<
    null | "approve" | "publish" | "lock"
  >(null);

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  async function reload() {
    setLoading(true);
    const [r, sc, lg] = await Promise.all([
      resultsService.get(assessmentId),
      scoresService.listByAssessment(assessmentId),
      resultsService.changeLog(assessmentId),
    ]);
    setResult(r);
    setScores(sc);
    setLog(lg);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  async function doAction() {
    if (!confirmAction || !user || !result) return;
    setWorking(true);
    try {
      if (confirmAction === "approve") {
        await resultsService.approve(result.assessmentId, user.fullName);
      } else if (confirmAction === "publish") {
        await resultsService.publish(result.assessmentId, user.fullName);
      } else if (confirmAction === "lock") {
        await resultsService.lock(result.assessmentId, user.fullName);
      }
      setConfirmAction(null);
      await reload();
    } finally {
      setWorking(false);
    }
  }

  async function doReturn() {
    if (!user || !result) return;
    setWorking(true);
    try {
      await resultsService.returnForCorrection(
        result.assessmentId,
        user.fullName,
        returnReason || "Returned for correction",
      );
      setReturnOpen(false);
      setReturnReason("");
      await reload();
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!result) {
    return (
      <EmptyState
        title="Result not found"
        action={
          <Link to="..">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    );
  }

  const s = result.status;

  return (
    <>
      <PageHeader
        title={`${result.className} · ${result.subjectName}`}
        description={`${result.termName} · ${result.academicYear} · Teacher: ${result.teacherName ?? "—"}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <RoleGate roles={["headmaster", "super_admin"]}>
              {s === "submitted" && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setReturnOpen(true)}
                    disabled={working}>
                    <RotateCcw className="h-4 w-4" />
                    Return
                  </Button>
                  <Button size="sm" onClick={() => setConfirmAction("approve")}>
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
              {s === "approved" && (
                <Button size="sm" onClick={() => setConfirmAction("publish")}>
                  <Send className="h-4 w-4" />
                  Publish
                </Button>
              )}
              {s === "published" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmAction("lock")}>
                  <Lock className="h-4 w-4" />
                  Lock
                </Button>
              )}
            </RoleGate>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-ink-500">Status</div>
          <div className="mt-1">
            <Badge
              tone={
                s === "submitted"
                  ? "info"
                  : s === "approved"
                    ? "brand"
                    : s === "published"
                      ? "success"
                      : s === "locked"
                        ? "danger"
                        : "neutral"
              }>
              {s}
            </Badge>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Students</div>
          <div className="text-lg font-semibold text-ink-900 tabular-nums mt-1">
            {result.studentCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Class average</div>
          <div className="text-lg font-semibold text-ink-900 tabular-nums mt-1">
            {result.classAverage.toFixed(1)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">Range</div>
          <div className="text-lg font-semibold text-ink-900 tabular-nums mt-1">
            {result.lowest.toFixed(1)} – {result.highest.toFixed(1)}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Marks"
          description="Review individual student scores"
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Student</th>
                  <th className="text-left px-4 py-2.5 font-medium">
                    Admission #
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">
                    Assessment
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">Exam</th>
                  <th className="text-right px-4 py-2.5 font-medium">Final</th>
                  <th className="text-left px-4 py-2.5 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {scores.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-ink-500">
                      No marks recorded yet.
                    </td>
                  </tr>
                ) : (
                  scores.map((sc) => (
                    <tr key={sc.id} className="hover:bg-ink-50/60">
                      <td className="px-4 py-2 font-medium text-ink-900">
                        {sc.studentName}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-ink-500">
                        {sc.admissionNumber}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {sc.assessmentRaw ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {sc.examRaw ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold">
                        {sc.finalScore.toFixed(1)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center h-6 min-w-[1.75rem] px-2 rounded-md text-xs font-semibold",
                            gradeTone(sc.grade),
                          )}>
                          {sc.grade}
                        </span>
                        <span className="ml-2 text-xs text-ink-500">
                          {sc.gradeLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {log.length > 0 && (
        <Card>
          <CardHeader title="Change history" />
          <CardBody className="p-0">
            <ul className="divide-y divide-ink-200">
              {log.map((l) => (
                <li key={l.id} className="px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink-900">
                      <span className="font-medium capitalize">{l.action}</span>
                      <span className="text-ink-500"> by {l.actorName}</span>
                    </div>
                    {l.reason && (
                      <div className="text-xs text-ink-600 mt-0.5">
                        Reason: {l.reason}
                      </div>
                    )}
                    <div className="text-xs text-ink-500 mt-0.5">
                      {new Date(l.createdAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={doAction}
        loading={working}
        title={
          confirmAction === "approve"
            ? "Approve results?"
            : confirmAction === "publish"
              ? "Publish results?"
              : "Lock results?"
        }
        message={
          confirmAction === "approve"
            ? "Once approved, the results are ready for publication. You can still return them for correction before publishing."
            : confirmAction === "publish"
              ? "Published results become visible to students (subject to scratch-card access). Corrections after publication require the traceable correction workflow."
              : "Locked results cannot be modified further. Use only after the school has accepted them as final."
        }
        confirmLabel={
          confirmAction === "approve"
            ? "Approve"
            : confirmAction === "publish"
              ? "Publish"
              : "Lock"
        }
        danger={confirmAction === "lock"}
      />

      <Dialog
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Return for correction"
        description="Explain what needs to be corrected. This will be visible to the teacher."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setReturnOpen(false)}
              disabled={working}>
              Cancel
            </Button>
            <Button onClick={doReturn} disabled={working}>
              {working ? "Returning…" : "Return"}
            </Button>
          </>
        }>
        <FormField label="Reason" required>
          <Textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="e.g. Recheck student #4's exam score."
          />
        </FormField>
      </Dialog>
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
