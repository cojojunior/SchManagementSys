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
import { FormField } from "@/components/ui/FormField";
import { useLookup } from "@/hooks/useLookup";
import { feeStructuresService } from "@/services/supabase/fee-structures";
import { classesService } from "@/services/supabase/classes";
import { academicYearsService } from "@/services/supabase/academic-years";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { FeeItemCategory } from "@/types/finance";
import type { Division } from "@/types/common";

const CATEGORIES: { value: FeeItemCategory; label: string }[] = [
  { value: "tuition", label: "Tuition" },
  { value: "feeding", label: "Feeding" },
  { value: "transport", label: "Transport" },
  { value: "books", label: "Books & Materials" },
  { value: "uniform", label: "Uniform" },
  { value: "result_access", label: "Result Access" },
  { value: "other", label: "Other" },
];

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.enum([
    "tuition",
    "feeding",
    "transport",
    "books",
    "uniform",
    "result_access",
    "other",
  ]),
  amount: z.coerce.number().min(0, "Amount must be ≥ 0"),
  description: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  division: z.enum(["nursery", "kg", "primary", "jhs"]),
  classId: z.string().optional(),
  academicYear: z.string().min(1),
  termId: z.string().min(1, "Term is required"),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  status: z.enum(["active", "inactive", "archived"]),
});

type FormValues = z.infer<typeof schema>;

export default function FeeStructureFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: classes } = useLookup(async () => {
    const res = await classesService.list({}, 1, 200);
    return res.data;
  });
  const { data: terms } = useLookup(() => academicYearsService.listTerms());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      division: "primary",
      academicYear: "2024/2025",
      status: "active",
      items: [{ name: "Tuition", category: "tuition", amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!id) return;
    feeStructuresService.get(id).then((s) => {
      if (!s) return;
      form.reset({
        name: s.name,
        division: s.division,
        classId: s.classId ?? "",
        academicYear: s.academicYear,
        termId: s.termId,
        status: s.status,
        items: s.items.map((i) => ({
          name: i.name,
          category: i.category,
          amount: i.amount,
          description: i.description ?? "",
        })),
      });
    });
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...values,
        classId: values.classId === "" ? undefined : values.classId,
      };
      if (isEdit && id) {
        await feeStructuresService.update(id, payload);
      } else {
        await feeStructuresService.create(payload);
      }
      navigate("..");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const { register, handleSubmit, watch, formState } = form;
  const { errors } = formState;
  const selectedDivision = watch("division") as Division;
  const filteredClasses = classes.filter(
    (c) => c.division === selectedDivision,
  );
  const items = watch("items") ?? [];
  const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit fee structure" : "Add fee structure"}
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
                  placeholder="e.g. JHS 2024/2025 Term 1"
                  {...register("name")}
                  invalid={!!errors.name}
                />
              </FormField>
              <FormField
                label="Division"
                required
                error={errors.division?.message}>
                <Select {...register("division")}>
                  <option value="nursery">Nursery</option>
                  <option value="kg">KG</option>
                  <option value="primary">Primary</option>
                  <option value="jhs">JHS</option>
                </Select>
              </FormField>
              <FormField
                label="Class"
                hint="Optional — leave blank to apply to the whole division"
                error={errors.classId?.message}>
                <Select {...register("classId")}>
                  <option value="">All classes in division</option>
                  {filteredClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Term" required error={errors.termId?.message}>
                <Select {...register("termId")}>
                  <option value="">Select a term…</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.academicYearId}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label="Academic year"
                required
                error={errors.academicYear?.message}>
                <Input {...register("academicYear")} />
              </FormField>
              <FormField label="Status" required error={errors.status?.message}>
                <Select {...register("status")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </Select>
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink-900">Fee items</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Line items charged to each student
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({ name: "", category: "other", amount: 0 })
                }>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>

            {errors.items?.message && (
              <p className="text-xs text-red-600">{errors.items.message}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 sm:grid-cols-12 p-3 border border-ink-200 rounded-lg items-start">
                  <div className="sm:col-span-5">
                    <FormField
                      label="Name"
                      error={errors.items?.[index]?.name?.message}>
                      <Input
                        {...register(`items.${index}.name`)}
                        placeholder="Tuition"
                      />
                    </FormField>
                  </div>
                  <div className="sm:col-span-3">
                    <FormField
                      label="Category"
                      error={errors.items?.[index]?.category?.message}>
                      <Select {...register(`items.${index}.category`)}>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                  <div className="sm:col-span-3">
                    <FormField
                      label={`Amount (${CURRENCY_SYMBOL})`}
                      error={errors.items?.[index]?.amount?.message}>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.amount`)}
                      />
                    </FormField>
                  </div>
                  <div className="sm:col-span-1 flex sm:justify-end pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink-200">
              <span className="text-sm text-ink-500">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {CURRENCY_SYMBOL}
                {total.toLocaleString("en-GH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
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
                : "Create structure"}
          </Button>
        </div>
      </form>
    </>
  );
}
