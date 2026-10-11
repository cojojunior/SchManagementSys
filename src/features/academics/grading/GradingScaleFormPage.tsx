import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { gradingService } from "@/services/supabase/grading";
import type { Division } from "@/types/common";

const DIVISION_OPTIONS: { value: Division; label: string }[] = [
  { value: "nursery", label: "Nursery" },
  { value: "kg", label: "KG" },
  { value: "primary", label: "Primary" },
  { value: "jhs", label: "JHS" },
];

const bandSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  label: z.string().min(1, "Label is required"),
  minScore: z.coerce.number().int().min(0).max(100),
  maxScore: z.coerce.number().int().min(0).max(100),
  remark: z.string().optional(),
  orderIndex: z.coerce.number().int().min(1),
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  divisions: z
    .array(z.enum(["nursery", "kg", "primary", "jhs"]))
    .min(1, "Select at least one division"),
  type: z.enum(["numeric", "descriptive"]),
  isActive: z.boolean(),
  bands: z.array(bandSchema).min(1, "Add at least one grade band"),
});

type FormValues = z.infer<typeof schema>;

export default function GradingScaleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      divisions: [],
      type: "numeric",
      isActive: true,
      bands: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bands",
  });

  useEffect(() => {
    if (!id) return;
    gradingService.get(id).then((s) => {
      if (!s) return;
      form.reset({
        name: s.name,
        description: s.description ?? "",
        divisions: s.divisions,
        type: s.type,
        isActive: s.isActive,
        bands: s.bands.map((b) => ({
          grade: b.grade,
          label: b.label,
          minScore: b.minScore,
          maxScore: b.maxScore,
          remark: b.remark ?? "",
          orderIndex: b.orderIndex,
        })),
      });
    });
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && id) {
        await gradingService.update(id, values);
      } else {
        await gradingService.create(values);
      }
      navigate("..");
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

  function addBand() {
    const nextIndex = fields.length + 1;
    append({
      grade: "",
      label: "",
      minScore: 0,
      maxScore: 100,
      remark: "",
      orderIndex: nextIndex,
    });
  }

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit grading scale" : "Add grading scale"}
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
              <FormField label="Name" required error={errors.name?.message}>
                <Input
                  placeholder="e.g. Primary & JHS (BECE 1–9)"
                  {...register("name")}
                  invalid={!!errors.name}
                />
              </FormField>
              <FormField label="Type" required error={errors.type?.message}>
                <Select {...register("type")}>
                  <option value="numeric">Numeric (1–9)</option>
                  <option value="descriptive">Descriptive (E/VG/G/D)</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Description" error={errors.description?.message}>
              <Textarea
                placeholder="Optional note about this scale"
                {...register("description")}
              />
            </FormField>

            <FormField
              label="Divisions"
              required
              error={errors.divisions?.message}
              hint="Which divisions use this scale">
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

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("isActive")}
                className="rounded"
              />
              Active
            </label>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink-900">Grade bands</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  From best to worst. Higher scores should appear first.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addBand}>
                <Plus className="h-4 w-4" />
                Add band
              </Button>
            </div>

            {errors.bands?.message && (
              <p className="text-xs text-red-600">{errors.bands.message}</p>
            )}

            {fields.length === 0 ? (
              <p className="text-sm text-ink-500">
                No bands yet. Add the first one.
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 sm:grid-cols-12 p-3 border border-ink-200 rounded-lg items-start">
                    <div className="sm:col-span-1">
                      <FormField
                        label="Grade"
                        error={errors.bands?.[index]?.grade?.message}>
                        <Input
                          {...register(`bands.${index}.grade`)}
                          placeholder="1"
                        />
                      </FormField>
                    </div>
                    <div className="sm:col-span-3">
                      <FormField
                        label="Label"
                        error={errors.bands?.[index]?.label?.message}>
                        <Input
                          {...register(`bands.${index}.label`)}
                          placeholder="Excellent"
                        />
                      </FormField>
                    </div>
                    <div className="sm:col-span-2">
                      <FormField
                        label="Min"
                        error={errors.bands?.[index]?.minScore?.message}>
                        <Input
                          type="number"
                          {...register(`bands.${index}.minScore`)}
                        />
                      </FormField>
                    </div>
                    <div className="sm:col-span-2">
                      <FormField
                        label="Max"
                        error={errors.bands?.[index]?.maxScore?.message}>
                        <Input
                          type="number"
                          {...register(`bands.${index}.maxScore`)}
                        />
                      </FormField>
                    </div>
                    <div className="sm:col-span-3">
                      <FormField
                        label="Remark"
                        error={errors.bands?.[index]?.remark?.message}>
                        <Input
                          {...register(`bands.${index}.remark`)}
                          placeholder="Optional"
                        />
                      </FormField>
                    </div>
                    <div className="sm:col-span-1 flex sm:justify-end pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                    <input
                      type="hidden"
                      {...register(`bands.${index}.orderIndex`)}
                      value={index + 1}
                    />
                  </div>
                ))}
              </div>
            )}
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
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create scale"}
          </Button>
        </div>
      </form>
    </>
  );
}
