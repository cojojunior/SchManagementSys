import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/features/auth/AuthContext";
import { classesService } from "@/services/supabase/classes";
import { useReturnToList } from "@/hooks/useReturnToList";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  division: z.enum(["nursery", "kg", "primary", "jhs"]),
  level: z.coerce.number().int().min(1).max(9),
  stream: z.string().optional(),
  classTeacherId: z.string().optional(),
  capacity: z.coerce.number().int().min(1).max(80),
  academicYear: z.string().min(1),
  status: z.enum(["active", "inactive", "archived"]),
});

type FormValues = z.infer<typeof schema>;

export default function ClassFormPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const returnToList = useReturnToList();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Failsafe: Teachers cannot create or edit classes
  if (user?.role === "teacher") {
    return <Navigate to="/teacher/classes" replace />;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      division: "primary",
      level: 1,
      capacity: 30,
      academicYear: "2024/2025",
      status: "active",
    },
  });

  useEffect(() => {
    if (!id) return;
    classesService.get(id).then((c) => {
      if (!c) return;
      form.reset({
        name: c.name,
        division: c.division,
        level: c.level,
        stream: c.stream ?? "",
        classTeacherId: c.classTeacherId ?? "",
        capacity: c.capacity,
        academicYear: c.academicYear,
        status: c.status,
      });
    });
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && id) {
        await classesService.update(id, values);
      } else {
        await classesService.create(values);
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
        title={isEdit ? "Edit class" : "Add class"}
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
            <FormField label="Name" required error={errors.name?.message}>
              <Input
                placeholder="e.g. Primary 4"
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
            <FormField label="Level" required error={errors.level?.message}>
              <Input
                type="number"
                {...register("level")}
                invalid={!!errors.level}
              />
            </FormField>
            <FormField
              label="Stream"
              hint="Optional — leave blank for the current school structure"
              error={errors.stream?.message}>
              <Input {...register("stream")} />
            </FormField>
            <FormField
              label="Class teacher"
              hint="Full staff picker arrives with the Staff module"
              error={errors.classTeacherId?.message}>
              <Input
                placeholder="Staff ID (optional)"
                {...register("classTeacherId")}
              />
            </FormField>
            <FormField
              label="Capacity"
              required
              error={errors.capacity?.message}>
              <Input
                type="number"
                {...register("capacity")}
                invalid={!!errors.capacity}
              />
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
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create class"}
          </Button>
        </div>
      </form>
    </>
  );
}
