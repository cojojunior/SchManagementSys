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
import { staffService } from "@/services/staff";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import type { StaffFormValues } from "@/types/staff";

const ROLE_OPTIONS = ["", ...ROLES] as const;

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  otherNames: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"]),
  phone: z.string().min(7, "Valid phone required"),
  email: z.string().email("Invalid email"),
  address: z.string().min(1, "Address is required"),

  category: z.enum(["teaching", "non_teaching"]),
  department: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  employmentStatus: z.enum(["full_time", "part_time", "contract"]),
  dateHired: z.string().min(1, "Date hired is required"),
  qualification: z.string().optional(),

  systemRole: z.enum(ROLE_OPTIONS),

  accountStatus: z.enum(["active", "inactive", "archived"]),
});

type FormValues = z.infer<typeof schema>;

export default function StaffFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "male",
      category: "teaching",
      employmentStatus: "full_time",
      accountStatus: "active",
      systemRole: "",
    },
  });

  useEffect(() => {
    if (!id) return;
    staffService.get(id).then((s) => {
      if (!s) return;
      form.reset({
        firstName: s.firstName,
        lastName: s.lastName,
        otherNames: s.otherNames ?? "",
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        phone: s.phone,
        email: s.email,
        address: s.address,
        category: s.category,
        department: s.department ?? "",
        jobTitle: s.jobTitle,
        employmentStatus: s.employmentStatus,
        dateHired: s.dateHired,
        qualification: s.qualification ?? "",
        systemRole: (s.systemRole ?? "") as FormValues["systemRole"],
        accountStatus: s.accountStatus,
      });
    });
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      // Convert "" → null for the service layer
      const payload: StaffFormValues = {
        ...values,
        systemRole: values.systemRole === "" ? null : values.systemRole,
      };

      if (isEdit && id) {
        await staffService.update(id, payload);
      } else {
        await staffService.create(payload);
      }
      navigate("..");
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
        title={isEdit ? "Edit staff member" : "Add staff member"}
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
            <h3 className="font-semibold text-ink-900">Personal information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="First name"
                required
                error={errors.firstName?.message}>
                <Input
                  {...register("firstName")}
                  invalid={!!errors.firstName}
                />
              </FormField>
              <FormField
                label="Last name"
                required
                error={errors.lastName?.message}>
                <Input {...register("lastName")} invalid={!!errors.lastName} />
              </FormField>
              <FormField label="Other names" error={errors.otherNames?.message}>
                <Input {...register("otherNames")} />
              </FormField>
              <FormField
                label="Date of birth"
                required
                error={errors.dateOfBirth?.message}>
                <Input
                  type="date"
                  {...register("dateOfBirth")}
                  invalid={!!errors.dateOfBirth}
                />
              </FormField>
              <FormField label="Gender" required error={errors.gender?.message}>
                <Select {...register("gender")}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
              </FormField>
              <FormField label="Phone" required error={errors.phone?.message}>
                <Input {...register("phone")} invalid={!!errors.phone} />
              </FormField>
              <FormField label="Email" required error={errors.email?.message}>
                <Input
                  type="email"
                  {...register("email")}
                  invalid={!!errors.email}
                />
              </FormField>
              <FormField
                label="Residential address"
                required
                error={errors.address?.message}
                className="sm:col-span-2">
                <Textarea {...register("address")} invalid={!!errors.address} />
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5">
            <h3 className="font-semibold text-ink-900">Employment</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Category"
                required
                error={errors.category?.message}>
                <Select {...register("category")}>
                  <option value="teaching">Teaching</option>
                  <option value="non_teaching">Non-teaching</option>
                </Select>
              </FormField>
              <FormField
                label="Department"
                error={errors.department?.message}
                hint="e.g. Mathematics, Administration">
                <Input {...register("department")} />
              </FormField>
              <FormField
                label="Job title"
                required
                error={errors.jobTitle?.message}>
                <Input
                  placeholder="e.g. Mathematics Teacher"
                  {...register("jobTitle")}
                  invalid={!!errors.jobTitle}
                />
              </FormField>
              <FormField
                label="Employment status"
                required
                error={errors.employmentStatus?.message}>
                <Select {...register("employmentStatus")}>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                </Select>
              </FormField>
              <FormField
                label="Date hired"
                required
                error={errors.dateHired?.message}>
                <Input
                  type="date"
                  {...register("dateHired")}
                  invalid={!!errors.dateHired}
                />
              </FormField>
              <FormField
                label="Qualification"
                error={errors.qualification?.message}>
                <Input
                  placeholder="e.g. B.Ed Mathematics"
                  {...register("qualification")}
                />
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5">
            <h3 className="font-semibold text-ink-900">Portal access</h3>
            <p className="text-xs text-ink-500">
              Assigning a portal role here is a <strong>request</strong>. Actual
              account provisioning and role assignment happens through the Super
              Admin&apos;s Users &amp; Roles module in a later phase. No
              credentials are created from this form.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="System role"
                error={errors.systemRole?.message}
                hint="Leave blank for no portal access">
                <Select {...register("systemRole")}>
                  <option value="">No portal access</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label="Account status"
                required
                error={errors.accountStatus?.message}>
                <Select {...register("accountStatus")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </Select>
              </FormField>
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
                : "Create staff member"}
          </Button>
        </div>
      </form>
    </>
  );
}
