import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { academicYearsService } from "@/services/supabase/academic-years";
import type { AcademicTerm } from "@/types/academic-year";

const schema = z.object({
  name: z.enum(["Term 1", "Term 2", "Term 3"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isCurrent: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function TermFormDialog({
  open,
  onClose,
  academicYearId,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  academicYearId: string;
  editing: AcademicTerm | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "Term 1",
      isCurrent: false,
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
      });
    } else {
      form.reset({
        name: "Term 1",
        startDate: "",
        endDate: "",
        isCurrent: false,
      });
    }
    setFormError(null);
  }, [open, editing, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await academicYearsService.updateTerm(editing.id, {
          ...values,
          academicYearId,
        });
      } else {
        await academicYearsService.createTerm({
          ...values,
          academicYearId,
        });
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
      title={editing ? "Edit term" : "Add term"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="term-form" disabled={submitting}>
            {submitting ? "Saving…" : editing ? "Save changes" : "Create term"}
          </Button>
        </>
      }>
      <form
        id="term-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4">
        <FormField label="Term" required error={errors.name?.message}>
          <Select {...register("name")}>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </Select>
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register("isCurrent")}
            className="rounded"
          />
          Mark as the current term
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
