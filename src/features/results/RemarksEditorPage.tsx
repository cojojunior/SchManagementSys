import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/features/auth/AuthContext";
import { RoleGate } from "@/features/auth/RoleGate";
import { studentsService } from "@/services/supabase/student";
import { academicYearsService } from "@/services/supabase/academic-years";
import { remarksService } from "@/services/supabase/remarks";
import type { Student } from "@/types/student";
import type { AcademicTerm } from "@/types/academic-year";
import type { Remark } from "@/types/remark";
import { formatDate } from "@/lib/format";

export default function RemarksEditorPage() {
  const { id: studentId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const termIdFromUrl = searchParams.get("term") ?? "";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [remark, setRemark] = useState<Remark | null>(null);
  const [teacherDraft, setTeacherDraft] = useState("");
  const [headmasterDraft, setHeadmasterDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"teacher" | "headmaster" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Load terms once
  useEffect(() => {
    let cancelled = false;
    academicYearsService.listTerms().then((t) => {
      if (!cancelled) setTerms(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Once terms arrive, ensure URL has a term
  useEffect(() => {
    if (termIdFromUrl) return;
    if (terms.length === 0) return;
    const current = terms.find((t) => t.isCurrent) ?? terms[0];
    if (!current) return;
    const next = new URLSearchParams(searchParams);
    next.set("term", current.id);
    setSearchParams(next, { replace: true });
  }, [termIdFromUrl, terms, searchParams, setSearchParams]);

  // 3. Load student + remark once termId is present
  useEffect(() => {
    if (!studentId || !termIdFromUrl) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      studentsService.get(studentId),
      remarksService.get(studentId, termIdFromUrl),
    ]).then(([st, rm]) => {
      if (cancelled) return;
      setStudent(st);
      setRemark(rm);
      setTeacherDraft(rm?.teacherRemark ?? "");
      setHeadmasterDraft(rm?.headmasterRemark ?? "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [studentId, termIdFromUrl]);

  async function saveTeacher() {
    if (!student || !termIdFromUrl || !user) return;
    setSaving(true);
    setFormError(null);
    try {
      const term = terms.find((t) => t.id === termIdFromUrl);
      const year = term?.academicYearId ?? "—";
      const updated = await remarksService.setTeacherRemark(
        student.id,
        termIdFromUrl,
        year,
        teacherDraft,
        undefined,
        user.fullName,
      );
      setRemark(updated);
      setSaved("teacher");
      setTimeout(() => setSaved(null), 2500);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveHeadmaster() {
    if (!student || !termIdFromUrl || !user) return;
    setSaving(true);
    setFormError(null);
    try {
      const term = terms.find((t) => t.id === termIdFromUrl);
      const year = term?.academicYearId ?? "—";
      const updated = await remarksService.setHeadmasterRemark(
        student.id,
        termIdFromUrl,
        year,
        headmasterDraft,
        user.fullName,
      );
      setRemark(updated);
      setSaved("headmaster");
      setTimeout(() => setSaved(null), 2500);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!student) {
    return (
      <EmptyState
        title="Student not found"
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
        title="Remarks"
        description={`${student.firstName} ${student.lastName} · ${student.className}`}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-ink-700 block mb-1.5">
              Term
            </label>
            <Select
              value={termIdFromUrl}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                next.set("term", e.target.value);
                setSearchParams(next, { replace: true });
              }}>
              <option value="">Select a term…</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.academicYearId}
                  {t.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Class Teacher's Remark"
            description="Written by the class teacher at end of term"
            action={
              remark?.teacherRemarkUpdatedAt ? (
                <Badge tone="neutral">
                  Updated {formatDate(remark.teacherRemarkUpdatedAt)}
                </Badge>
              ) : undefined
            }
          />
          <CardBody className="space-y-4">
            <FormField
              label="Remark"
              hint="Appears on the student's report card">
              <Textarea
                value={teacherDraft}
                onChange={(e) => setTeacherDraft(e.target.value)}
                placeholder="e.g. Ama has shown great improvement this term…"
                rows={5}
              />
            </FormField>
            {remark?.teacherName && (
              <p className="text-xs text-ink-500">
                Last edited by {remark.teacherName}
              </p>
            )}
            <RoleGate resource="scores" action="update">
              <div className="flex items-center justify-between">
                {saved === "teacher" && (
                  <span className="text-xs text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                <Button
                  onClick={saveTeacher}
                  disabled={saving}
                  className="ml-auto">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : "Save teacher remark"}
                </Button>
              </div>
            </RoleGate>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Headmaster's Remark"
            description="Optional — published with the report card"
            action={
              remark?.headmasterRemarkUpdatedAt ? (
                <Badge tone="neutral">
                  Updated {formatDate(remark.headmasterRemarkUpdatedAt)}
                </Badge>
              ) : undefined
            }
          />
          <CardBody className="space-y-4">
            <FormField
              label="Remark"
              hint="Appears on the student's report card">
              <Textarea
                value={headmasterDraft}
                onChange={(e) => setHeadmasterDraft(e.target.value)}
                placeholder="e.g. Excellent results. Keep up the outstanding performance."
                rows={5}
              />
            </FormField>
            {remark?.headmasterName && (
              <p className="text-xs text-ink-500">
                Last edited by {remark.headmasterName}
              </p>
            )}
            <RoleGate roles={["headmaster", "super_admin"]}>
              <div className="flex items-center justify-between">
                {saved === "headmaster" && (
                  <span className="text-xs text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
                <Button
                  onClick={saveHeadmaster}
                  disabled={saving}
                  className="ml-auto">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : "Save headmaster remark"}
                </Button>
              </div>
            </RoleGate>
          </CardBody>
        </Card>
      </div>

      {formError && (
        <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {formError}
        </div>
      )}
    </>
  );
}
