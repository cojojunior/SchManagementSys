import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { RoleGate } from "@/features/auth/RoleGate";
import { assessmentWeightService } from "@/services/assessment-weight";
import type { AssessmentWeight } from "@/types/assessment-weight";
import { formatDate } from "@/lib/format";

const schema = z
  .object({
    assessmentPercent: z.coerce
      .number()
      .int()
      .min(0, "Must be 0–100")
      .max(100, "Must be 0–100"),
    examPercent: z.coerce
      .number()
      .int()
      .min(0, "Must be 0–100")
      .max(100, "Must be 0–100"),
  })
  .refine((v) => v.assessmentPercent + v.examPercent === 100, {
    message: "Assessment and Exam must total 100%",
    path: ["examPercent"],
  });

type FormValues = z.infer<typeof schema>;

export default function AssessmentWeightPage() {
  const [current, setCurrent] = useState<AssessmentWeight | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { assessmentPercent: 40, examPercent: 60 },
  });

  useEffect(() => {
    assessmentWeightService.get().then((w) => {
      setCurrent(w);
      form.reset({
        assessmentPercent: w.assessmentPercent,
        examPercent: w.examPercent,
      });
      setLoading(false);
    });
  }, [form]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setFormError(null);
    setSaved(false);
    try {
      const updated = await assessmentWeightService.update(values);
      setCurrent(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const { register, handleSubmit, watch, formState } = form;
  const { errors } = formState;

  const assessmentValue = watch("assessmentPercent");
  const examValue = watch("examPercent");
  const total = Number(assessmentValue || 0) + Number(examValue || 0);

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  return (
    <>
      <PageHeader
        title="Assessment Weights"
        description="Configure how final subject scores are calculated"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weight configuration"
            description="Final score = (Assessment × weight) + (Exam × weight)"
          />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Assessment weight (%)"
                  required
                  error={errors.assessmentPercent?.message}
                  hint="Homework, class tests, projects, mid-term"
                >
                  <Input
                    type="number"
                    {...register("assessmentPercent")}
                    invalid={!!errors.assessmentPercent}
                    disabled={!current ? false : undefined}
                  />
                </FormField>
                <FormField
                  label="End-of-Term Exam weight (%)"
                  required
                  error={errors.examPercent?.message}
                  hint="Final exam at end of term"
                >
                  <Input
                    type="number"
                    {...register("examPercent")}
                    invalid={!!errors.examPercent}
                  />
                </FormField>
              </div>

              <div
                className={[
                  "rounded-lg border px-4 py-3 text-sm flex items-center justify-between",
                  total === 100
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                ].join(" ")}
              >
                <span>Total</span>
                <span className="font-semibold tabular-nums">{total}%</span>
              </div>

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              {saved && (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-500">
                  Last updated:{" "}
                  {current ? formatDate(current.updatedAt) : "—"}
                </p>
                <RoleGate resource="school_settings" action="update">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </RoleGate>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="How it works" />
          <CardBody className="space-y-3 text-sm text-ink-600">
            <p>
              Each subject's final score for a student in a term is calculated
              as:
            </p>
            <div className="rounded-lg bg-ink-50 px-3 py-2 font-mono text-xs">
              final = (assessment × {assessmentValue || 0}%) + (exam × {examValue || 0}%)
            </div>
            <p>
              The weights must total 100%. Changes apply to future score
              calculations. Published results are not retroactively recalculated.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}