import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { useLookup } from "@/hooks/useLookup";
import { assessmentsService } from "@/services/supabase/assessments";
import { classesService } from "@/services/supabase/classes";
import { subjectsService } from "@/services/supabase/subjects";
import { academicYearsService } from "@/services/supabase/academic-years";
import { staffService } from "@/services/supabase/staff";
import type { AssessmentFormValues } from "@/types/assessment";
import { useReturnToList } from "@/hooks/useReturnToList";

const schema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  termId: z.string().min(1, "Term is required"),
  teacherId: z.string().optional(),
  status: z.enum(["draft", "open", "closed"]),
  maxAssessmentScore: z.coerce.number().int().min(1).max(100),
  maxExamScore: z.coerce.number().int().min(1).max(100),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AssessmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
   const returnToList = useReturnToList();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: classes } = useLookup(async () => {
    const res = await classesService.list({}, 1, 200);
    return res.data;
  });
  const { data: subjects } = useLookup(async () => {
    const res = await subjectsService.list({}, 1, 200);
    return res.data;
  });
  const { data: terms } = useLookup(async () => {
    return academicYearsService.listTerms();
  });
  const { data: teachers } = useLookup(async () => {
    const res = await staffService.list({ category: "teaching" }, 1, 200);
    return res.data;
  });

 

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      academicYear: "2024/2025",
      status: "draft",
      maxAssessmentScore: 40,
      maxExamScore: 60,
    },
  });

  useEffect(() => {
    if (!id) return;
    assessmentsService.get(id).then((a) => {
      if (!a) return;
      form.reset({
        classId: a.classId,
        subjectId: a.subjectId,
        academicYear: a.academicYear,
        termId: a.termId,
        teacherId: a.teacherId ?? "",
        status: a.status,
        maxAssessmentScore: a.maxAssessmentScore,
        maxExamScore: a.maxExamScore,
        dueDate: a.dueDate ?? "",
        notes: a.notes ?? "",
      });
    });
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: AssessmentFormValues = {
        ...values,
        teacherId: values.teacherId === "" ? undefined : values.teacherId,
        dueDate: values.dueDate === "" ? undefined : values.dueDate,
      };
      if (isEdit && id) {
        await assessmentsService.update(id, payload);
      } else {
        await assessmentsService.create(payload);
      }
      returnToList();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit assessment" : "Add assessment"}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <FormField label="Class" required error={errors.classId?.message}>
              <Select {...register("classId")} invalid={!!errors.classId}>
                <option value="">Select a class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Subject"
              required
              error={errors.subjectId?.message}>
              <Select {...register("subjectId")} invalid={!!errors.subjectId}>
                <option value="">Select a subject…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Term" required error={errors.termId?.message}>
              <Select {...register("termId")} invalid={!!errors.termId}>
                <option value="">Select a term…</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.academicYearName ?? ""})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Academic year"
              required
              error={errors.academicYear?.message}>
              <Input
                {...register("academicYear")}
                invalid={!!errors.academicYear}
              />
            </FormField>
            <FormField
              label="Teacher"
              hint="Optional — usually derived from teaching assignment"
              error={errors.teacherId?.message}>
              <Select {...register("teacherId")}>
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status" required error={errors.status?.message}>
              <Select {...register("status")}>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Select>
            </FormField>
            <FormField
              label="Assessment max score"
              required
              error={errors.maxAssessmentScore?.message}
              hint="Default: 40">
              <Input
                type="number"
                {...register("maxAssessmentScore")}
                invalid={!!errors.maxAssessmentScore}
              />
            </FormField>
            <FormField
              label="Exam max score"
              required
              error={errors.maxExamScore?.message}
              hint="Default: 60">
              <Input
                type="number"
                {...register("maxExamScore")}
                invalid={!!errors.maxExamScore}
              />
            </FormField>
            <FormField label="Due date" error={errors.dueDate?.message}>
              <Input type="date" {...register("dueDate")} />
            </FormField>
            <FormField
              label="Notes"
              error={errors.notes?.message}
              className="sm:col-span-2">
              <Textarea
                placeholder="Optional notes for teachers"
                {...register("notes")}
              />
            </FormField>
          </CardBody>
        </Card>

        {formError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {formError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create assessment"}
          </Button>
        </div>
      </form>
    </>
  );
}
