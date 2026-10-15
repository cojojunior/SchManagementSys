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
import { teachingAssignmentsService } from "@/services/supabase/teaching-assignments";
import { staffService } from "@/services/supabase/staff";
import { classesService } from "@/services/supabase/classes";
import { subjectsService } from "@/services/supabase/subjects";
import type { TeachingAssignmentFormValues } from "@/types/teaching-assignment";


const schema = z.object({
  staffId: z.string().min(1, "Teacher is required"),
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  termId: z.string().optional(),
  periodsPerWeek: z.coerce.number().int().min(0).max(40).optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function AssignmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: staff } = useLookup(async () => {
    const res = await staffService.list({ category: "teaching" }, 1, 200);
    return res.data;
  });
  const { data: classes } = useLookup(async () => {
    const res = await classesService.list({}, 1, 200);
    return res.data;
  });
  const { data: subjects } = useLookup(async () => {
    const res = await subjectsService.list({}, 1, 200);
    return res.data;
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      academicYear: "2024/2025",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!id) return;
    teachingAssignmentsService.get(id).then((a) => {
      if (!a) return;
      form.reset({
        staffId: a.staffId,
        classId: a.classId,
        subjectId: a.subjectId,
        academicYear: a.academicYear,
        termId: a.termId ?? "",
        periodsPerWeek: a.periodsPerWeek ?? undefined,
        notes: a.notes ?? "",
        isActive: a.isActive,
      });
    });
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: TeachingAssignmentFormValues = {
        ...values,
        termId: values.termId === "" ? undefined : values.termId,
      };

      if (isEdit && id) {
        await teachingAssignmentsService.update(id, payload);
      } else {
        await teachingAssignmentsService.create(payload);
      }
      navigate("/admin/assignments");
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
        title={isEdit ? "Edit assignment" : "Add assignment"}
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
            <FormField label="Teacher" required error={errors.staffId?.message}>
              <Select {...register("staffId")} invalid={!!errors.staffId}>
                <option value="">Select a teacher…</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </Select>
            </FormField>
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
              label="Periods per week"
              hint="Optional"
              error={errors.periodsPerWeek?.message}>
              <Input type="number" {...register("periodsPerWeek")} />
            </FormField>
            <FormField label="Active" error={errors.isActive?.message}>
              <Select
                {...register("isActive", { setValueAs: (v) => v === "true" })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </FormField>
            <FormField
              label="Notes"
              error={errors.notes?.message}
              className="sm:col-span-2">
              <Textarea
                placeholder="Optional — anything the school needs to know about this assignment"
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
                : "Create assignment"}
          </Button>
        </div>
      </form>
    </>
  );
}
