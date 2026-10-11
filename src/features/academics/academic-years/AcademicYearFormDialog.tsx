import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { academicYearsService } from "@/services/academic-years";
import type { AcademicYear } from "@/types/academic-year";
import { useState } from "react";

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .regex(/^\d{4}\/\d{4}$/, "Use format 2024/2025"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isCurrent: z.boolean(),
  status: z.enum(["active", "closed"]),
});

type FormValues = z.infer<typeof schema>;

export function AcademicYearFormDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: AcademicYear | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isCurrent: false,
      status: "active",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        name: editing.name,
        startDate: editing.startDate,
        endDate: editing.endDate,
        isCurrent: editing.isCurrent,
        status: editing.status,
      });
    } else {
      form.reset({
        name: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        status: "active",
      });
    }
    setFormError(null);
  }, [open, editing, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await academicYearsService.updateYear(editing.id, values);
      } else {
        await academicYearsService.createYear(values);
      }
      onSaved();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit academic year" : "Add academic year"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="academic-year-form" disabled={submitting}>
            {submitting ? "Saving…" : editing ? "Save changes" : "Create year"}
          </Button>
        </>
      }>
      <form
        id="academic-year-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4">
        <FormField
          label="Name"
          required
          error={errors.name?.message}
          hint="e.g. 2024/2025">
          <Input
            placeholder="2024/2025"
            {...register("name")}
            invalid={!!errors.name}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Start date"
            required
            error={errors.startDate?.message}>
            <Input
              type="date"
              {...register("startDate")}
              invalid={!!errors.startDate}
            />
          </FormField>
          <FormField label="End date" required error={errors.endDate?.message}>
            <Input
              type="date"
              {...register("endDate")}
              invalid={!!errors.endDate}
            />
          </FormField>
        </div>
        <FormField label="Status" required error={errors.status?.message}>
          <Select {...register("status")}>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </Select>
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register("isCurrent")}
            className="rounded"
          />
          Mark as the current academic year
        </label>
        {formError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {formError}
          </div>
        )}
      </form>
    </Dialog>
  );
}
