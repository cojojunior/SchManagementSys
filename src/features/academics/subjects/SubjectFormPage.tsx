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
import { useReturnToList } from "@/hooks/useReturnToList";
import { FormField } from "@/components/ui/FormField";
import { subjectsService } from "@/services/supabase/subjects";
import type { Division } from "@/types/common";

const DIVISION_OPTIONS: { value: Division; label: string }[] = [
  { value: "nursery", label: "Nursery" },
  { value: "kg", label: "KG" },
  { value: "primary", label: "Primary" },
  { value: "jhs", label: "JHS" },
];

const returnToList = useReturnToList();

const schema = z.object({
  code: z.string().min(1, "Code is required").max(8, "Code is too long"),
  name: z.string().min(1, "Name is required"),
  divisions: z
    .array(z.enum(["nursery", "kg", "primary", "jhs"]))
    .min(1, "Select at least one division"),
  isCore: z.boolean(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]),
});

type FormValues = z.infer<typeof schema>;

export default function SubjectFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      divisions: [],
      isCore: true,
      status: "active",
    },
  });

  useEffect(() => {
    if (!id) return;
    subjectsService.get(id).then((s) => {
      if (!s) return;
      form.reset({
        code: s.code,
        name: s.name,
        divisions: s.divisions,
        isCore: s.isCore,
        description: s.description ?? "",
        status: s.status,
      });
    });
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && id) {
        await subjectsService.update(id, values);
      } else {
        await subjectsService.create(values);
      }
      returnToList();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const { register, handleSubmit, watch, setValue, formState } = form;
  const { errors } = formState;
  const selectedDivisions = watch("divisions") ?? [];

  function toggleDivision(d: Division) {
    const next = selectedDivisions.includes(d)
      ? selectedDivisions.filter((x) => x !== d)
      : [...selectedDivisions, d];
    setValue("divisions", next, { shouldValidate: true });
  }

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit subject" : "Add subject"}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Code"
                required
                error={errors.code?.message}
                hint="e.g. MATH, ENG">
                <Input
                  placeholder="MATH"
                  {...register("code")}
                  invalid={!!errors.code}
                  className="font-mono uppercase"
                />
              </FormField>
              <FormField label="Name" required error={errors.name?.message}>
                <Input
                  placeholder="Mathematics"
                  {...register("name")}
                  invalid={!!errors.name}
                />
              </FormField>
              <FormField
                label="Type"
                required
                error={errors.isCore?.message}
                className="sm:col-span-2">
                <Select
                  {...register("isCore", { setValueAs: (v) => v === "true" })}>
                  <option value="true">Core</option>
                  <option value="false">Elective</option>
                </Select>
              </FormField>
            </div>

            <FormField
              label="Divisions"
              required
              error={errors.divisions?.message}
              hint="Select every division that takes this subject">
              <div className="flex flex-wrap gap-3 pt-1">
                {DIVISION_OPTIONS.map(({ value, label }) => {
                  const checked = selectedDivisions.includes(value);
                  return (
                    <label
                      key={value}
                      className={[
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm",
                        checked
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                      ].join(" ")}>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={checked}
                        onChange={() => toggleDivision(value)}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </FormField>

            <FormField label="Description" error={errors.description?.message}>
              <Textarea
                placeholder="Optional — short note about the subject"
                {...register("description")}
              />
            </FormField>

            <FormField label="Status" required error={errors.status?.message}>
              <Select {...register("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </Select>
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
                : "Create subject"}
          </Button>
        </div>
      </form>
    </>
  );
}
