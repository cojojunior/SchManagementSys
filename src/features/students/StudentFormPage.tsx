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
import { studentsService } from "@/services/students";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  otherNames: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"]),
  nationality: z.string().min(1, "Nationality is required"),
  division: z.enum(["nursery", "kg", "primary", "jhs"]),
  classId: z.string().min(1, "Class is required"),
  stream: z.string().optional(),
  academicYear: z.string().min(1),
  admissionDate: z.string().min(1, "Admission date is required"),
  address: z.string().min(1, "Address is required"),
  previousSchool: z.string().optional(),
  guardian: z.object({
    fullName: z.string().min(1, "Guardian name is required"),
    relationship: z.enum(["mother", "father", "guardian"]),
    phone: z.string().min(7, "Valid phone required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    address: z.string().min(1, "Guardian address is required"),
    isEmergencyContact: z.boolean(),
  }),
});

type FormValues = z.infer<typeof schema>;

export default function StudentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "male",
      division: "primary",
      nationality: "Ghanaian",
      academicYear: "2024/2025",
      guardian: {
        relationship: "mother",
        isEmergencyContact: true,
      },
    },
  });

  useEffect(() => {
    if (!id) return;
    studentsService.get(id).then((s) => {
      if (!s) return;
      form.reset({
        firstName: s.firstName,
        lastName: s.lastName,
        otherNames: s.otherNames ?? "",
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        nationality: s.nationality,
        division: s.division,
        classId: s.classId,
        stream: s.stream ?? "",
        academicYear: s.academicYear,
        admissionDate: s.admissionDate,
        address: s.address,
        previousSchool: s.previousSchool ?? "",
        guardian: {
          fullName: s.guardian.fullName,
          relationship: s.guardian.relationship,
          phone: s.guardian.phone,
          email: s.guardian.email ?? "",
          address: s.guardian.address,
          isEmergencyContact: s.guardian.isEmergencyContact,
        },
      });
    });
  }, [id, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && id) {
        await studentsService.update(id, values as any);
      } else {
        await studentsService.create(values as any);
      }
      navigate("/admin/students");
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
        title={isEdit ? "Edit student" : "Add student"}
        description={
          isEdit ? "Update the student's record" : "Create a new student record"
        }
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
            <h3 className="font-semibold text-ink-900">Student</h3>
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
              <FormField
                label="Nationality"
                required
                error={errors.nationality?.message}>
                <Input
                  {...register("nationality")}
                  invalid={!!errors.nationality}
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
                required
                error={errors.classId?.message}
                hint="e.g. cls-pri4, cls-jhs2, cls-nur1, cls-kg1">
                <Input
                  placeholder="e.g. cls-pri4"
                  {...register("classId")}
                  invalid={!!errors.classId}
                />
              </FormField>
              <FormField label="Stream" error={errors.stream?.message}>
                <Input placeholder="Optional" {...register("stream")} />
              </FormField>
              <FormField
                label="Academic year"
                required
                error={errors.academicYear?.message}>
                <Input {...register("academicYear")} />
              </FormField>
              <FormField
                label="Admission date"
                required
                error={errors.admissionDate?.message}>
                <Input
                  type="date"
                  {...register("admissionDate")}
                  invalid={!!errors.admissionDate}
                />
              </FormField>
              <FormField
                label="Previous school"
                error={errors.previousSchool?.message}>
                <Input {...register("previousSchool")} />
              </FormField>
            </div>
            <FormField
              label="Residential address"
              required
              error={errors.address?.message}>
              <Textarea {...register("address")} invalid={!!errors.address} />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5">
            <h3 className="font-semibold text-ink-900">Guardian</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full name"
                required
                error={errors.guardian?.fullName?.message}>
                <Input
                  {...register("guardian.fullName")}
                  invalid={!!errors.guardian?.fullName}
                />
              </FormField>
              <FormField
                label="Relationship"
                required
                error={errors.guardian?.relationship?.message}>
                <Select {...register("guardian.relationship")}>
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="guardian">Guardian</option>
                </Select>
              </FormField>
              <FormField
                label="Phone"
                required
                error={errors.guardian?.phone?.message}>
                <Input
                  {...register("guardian.phone")}
                  invalid={!!errors.guardian?.phone}
                />
              </FormField>
              <FormField label="Email" error={errors.guardian?.email?.message}>
                <Input
                  type="email"
                  {...register("guardian.email")}
                  invalid={!!errors.guardian?.email}
                />
              </FormField>
              <FormField
                label="Address"
                required
                error={errors.guardian?.address?.message}
                className="sm:col-span-2">
                <Textarea
                  {...register("guardian.address")}
                  invalid={!!errors.guardian?.address}
                />
              </FormField>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  {...register("guardian.isEmergencyContact")}
                  className="rounded"
                />
                Use as emergency contact
              </label>
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
                : "Create student"}
          </Button>
        </div>
      </form>
    </>
  );
}
