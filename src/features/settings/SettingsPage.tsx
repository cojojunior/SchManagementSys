import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { settingsService } from "@/services/supabase/settings";

const schema = z
  .object({
    name: z.string().min(1, "School name is required"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    logoUrl: z.string().optional(),
    currencyCode: z.string().min(1),
    currencySymbol: z.string().min(1),
    timezone: z.string().min(1),
    scratchCardPriceNursery: z.coerce.number().min(0),
    scratchCardPriceKg: z.coerce.number().min(0),
    scratchCardPricePrimary: z.coerce.number().min(0),
    scratchCardPriceJhs: z.coerce.number().min(0),
    scratchCardMaxUses: z.coerce.number().int().min(1).max(20),
    revenueSplitSchoolPercent: z.coerce.number().int().min(0).max(100),
    revenueSplitPartnerPercent: z.coerce.number().int().min(0).max(100),
    revenueSplitPartnerName: z.string().optional(),
  })
  .refine(
    (v) => v.revenueSplitSchoolPercent + v.revenueSplitPartnerPercent === 100,
    {
      message: "Revenue split must total 100%",
      path: ["revenueSplitPartnerPercent"],
    },
  );

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "Supreme Academy",
      currencyCode: "GHS",
      currencySymbol: "GH₵",
      timezone: "Africa/Accra",
      scratchCardPriceNursery: 10,
      scratchCardPriceKg: 10,
      scratchCardPricePrimary: 15,
      scratchCardPriceJhs: 20,
      scratchCardMaxUses: 3,
      revenueSplitSchoolPercent: 50,
      revenueSplitPartnerPercent: 50,
      revenueSplitPartnerName: "Scratch Card Operator",
    },
  });

  useEffect(() => {
    settingsService.get().then((s) => {
      form.reset({
        name: s.name,
        address: s.address ?? "",
        phone: s.phone ?? "",
        email: s.email ?? "",
        logoUrl: s.logoUrl ?? "",
        currencyCode: s.currencyCode,
        currencySymbol: s.currencySymbol,
        timezone: s.timezone,
        scratchCardPriceNursery: s.scratchCardPriceNursery,
        scratchCardPriceKg: s.scratchCardPriceKg,
        scratchCardPricePrimary: s.scratchCardPricePrimary,
        scratchCardPriceJhs: s.scratchCardPriceJhs,
        scratchCardMaxUses: s.scratchCardMaxUses,
        revenueSplitSchoolPercent: s.revenueSplitSchoolPercent,
        revenueSplitPartnerPercent: s.revenueSplitPartnerPercent,
        revenueSplitPartnerName: s.revenueSplitPartnerName ?? "",
      });
      setLoading(false);
    });
  }, [form]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setFormError(null);
    setSaved(false);
    try {
      await settingsService.update({
        ...values,
        email: values.email || undefined,
        address: values.address || undefined,
        phone: values.phone || undefined,
        logoUrl: values.logoUrl || undefined,
        revenueSplitPartnerName: values.revenueSplitPartnerName || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure the school's identity, currency, and policies"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* School identity */}
        <Card>
          <CardHeader title="School identity" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="School name"
              required
              error={errors.name?.message}>
              <Input {...register("name")} invalid={!!errors.name} />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <Input
                type="email"
                {...register("email")}
                invalid={!!errors.email}
              />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <Input {...register("phone")} />
            </FormField>
            <FormField label="Logo URL" error={errors.logoUrl?.message}>
              <Input {...register("logoUrl")} placeholder="https://…" />
            </FormField>
            <FormField
              label="Address"
              error={errors.address?.message}
              className="sm:col-span-2">
              <Input {...register("address")} />
            </FormField>
          </CardBody>
        </Card>

        {/* Currency & timezone */}
        <Card>
          <CardHeader title="Currency & timezone" />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="Currency code"
              required
              error={errors.currencyCode?.message}>
              <Input {...register("currencyCode")} placeholder="GHS" />
            </FormField>
            <FormField
              label="Currency symbol"
              required
              error={errors.currencySymbol?.message}>
              <Input {...register("currencySymbol")} placeholder="GH₵" />
            </FormField>
            <FormField
              label="Timezone"
              required
              error={errors.timezone?.message}>
              <Input {...register("timezone")} placeholder="Africa/Accra" />
            </FormField>
          </CardBody>
        </Card>

        {/* Scratch cards */}
        <Card>
          <CardHeader
            title="Scratch cards"
            description="Prices per division and maximum uses per card"
          />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="Nursery price"
              required
              error={errors.scratchCardPriceNursery?.message}>
              <Input
                type="number"
                step="0.01"
                {...register("scratchCardPriceNursery")}
              />
            </FormField>
            <FormField
              label="KG price"
              required
              error={errors.scratchCardPriceKg?.message}>
              <Input
                type="number"
                step="0.01"
                {...register("scratchCardPriceKg")}
              />
            </FormField>
            <FormField
              label="Primary price"
              required
              error={errors.scratchCardPricePrimary?.message}>
              <Input
                type="number"
                step="0.01"
                {...register("scratchCardPricePrimary")}
              />
            </FormField>
            <FormField
              label="JHS price"
              required
              error={errors.scratchCardPriceJhs?.message}>
              <Input
                type="number"
                step="0.01"
                {...register("scratchCardPriceJhs")}
              />
            </FormField>
            <FormField
              label="Max uses per card"
              required
              error={errors.scratchCardMaxUses?.message}>
              <Input type="number" {...register("scratchCardMaxUses")} />
            </FormField>
          </CardBody>
        </Card>

        {/* Revenue split */}
        <Card>
          <CardHeader
            title="Revenue split"
            description="How scratch-card sales revenue is shared"
          />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="School %"
              required
              error={errors.revenueSplitSchoolPercent?.message}>
              <Input
                type="number"
                {...register("revenueSplitSchoolPercent")}
                invalid={!!errors.revenueSplitSchoolPercent}
              />
            </FormField>
            <FormField
              label="Partner %"
              required
              error={errors.revenueSplitPartnerPercent?.message}>
              <Input
                type="number"
                {...register("revenueSplitPartnerPercent")}
                invalid={!!errors.revenueSplitPartnerPercent}
              />
            </FormField>
            <FormField
              label="Partner name"
              error={errors.revenueSplitPartnerName?.message}>
              <Input {...register("revenueSplitPartnerName")} />
            </FormField>
          </CardBody>
        </Card>

        {formError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {formError}
          </div>
        )}

        {saved && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Settings saved.
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </>
  );
}
