import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { usersService } from "@/services/supabase/users";
import { ROLE_LABELS, type Role } from "@/lib/constants";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["super_admin", "headmaster", "teacher", "secretary"]),
  staffId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function UserFormPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "teacher",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await usersService.provisionUser(values);
      navigate("..");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  const roles: Array<Exclude<Role, "student">> = [
    "super_admin",
    "headmaster",
    "teacher",
    "secretary",
  ];

  return (
    <>
      <PageHeader
        title="Add staff account"
        description="Create a real login for a staff member"
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
            <FormField
              label="Full name"
              required
              error={errors.fullName?.message}>
              <Input {...register("fullName")} invalid={!!errors.fullName} />
            </FormField>
            <FormField label="Email" required error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="off"
                {...register("email")}
                invalid={!!errors.email}
              />
            </FormField>
            <FormField
              label="Temporary password"
              required
              error={errors.password?.message}
              hint="At least 8 characters. The user can change it later.">
              <Input
                type="text"
                autoComplete="new-password"
                {...register("password")}
                invalid={!!errors.password}
              />
            </FormField>
            <FormField label="Role" required error={errors.role?.message}>
              <Select {...register("role")}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Staff ID (optional)"
              error={errors.staffId?.message}
              hint="Link to an existing staff record, if any"
              className="sm:col-span-2">
              <Input {...register("staffId")} placeholder="e.g. staff UUID" />
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
            {submitting ? "Creating…" : "Create account"}
          </Button>
        </div>
      </form>
    </>
  );
}
