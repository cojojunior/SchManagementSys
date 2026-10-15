import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar,
  Award,
  Percent,
  Receipt,
  School,
  ClipboardList,
  FileText,
  Banknote,
  Users,
  ScrollText,
  BarChart3,
  Save,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { settingsService } from "@/services/supabase/settings";
import { cn } from "@/lib/cn";

// ─────────────────────────────────────────────────────────────
// Settings hub link cards
// ─────────────────────────────────────────────────────────────

type LinkCard = {
  to: string;
  label: string;
  description: string;
  icon: typeof Calendar;
  tone: "brand" | "emerald" | "amber" | "sky" | "red" | "violet";
};

type LinkGroup = {
  title: string;
  cards: LinkCard[];
};

const GROUPS: LinkGroup[] = [
  {
    title: "Academic Configuration",
    cards: [
      {
        to: "/admin/academic-years",
        label: "Academic Years & Terms",
        description: "Terms, current year, current term",
        icon: Calendar,
        tone: "brand",
      },
      {
        to: "/admin/grading",
        label: "Grading Scales",
        description: "Grade bands per division",
        icon: Award,
        tone: "sky",
      },
      {
        to: "/admin/assessment-weight",
        label: "Assessment Weights",
        description: "40% assessment / 60% exam",
        icon: Percent,
        tone: "amber",
      },
      {
        to: "/admin/classes",
        label: "Classes",
        description: "Class list, streams, capacity",
        icon: School,
        tone: "emerald",
      },
      
      {
        to: "/admin/assignments",
        label: "Teaching Assignments",
        description: "Who teaches what, where",
        icon: ClipboardList,
        tone: "brand",
      },
    ],
  },
  {
    title: "Finance",
    cards: [
      {
        to: "/admin/fees",
        label: "Fee Structures",
        description: "Term fees by division",
        icon: Receipt,
        tone: "emerald",
      },
      {
        to: "/admin/invoices",
        label: "Invoices",
        description: "Billing and balances",
        icon: FileText,
        tone: "brand",
      },
      {
        to: "/admin/payments",
        label: "Payments",
        description: "Received payments log",
        icon: Banknote,
        tone: "sky",
      },
    ],
  },
  {
    title: "Administration",
    cards: [
      {
        to: "/admin/users",
        label: "Users & Roles",
        description: "Staff accounts and permissions",
        icon: Users,
        tone: "red",
      },
      {
        to: "/admin/audit",
        label: "Audit Log",
        description: "Track privileged actions",
        icon: ScrollText,
        tone: "amber",
      },
      {
        to: "/admin/reports",
        label: "Reports",
        description: "Enrollment, finance, performance",
        icon: BarChart3,
        tone: "violet",
      },
    ],
  },
];

const TONE_MAP: Record<LinkCard["tone"], { bg: string; text: string }> = {
  brand: { bg: "bg-brand-50", text: "text-brand-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
  sky: { bg: "bg-sky-50", text: "text-sky-700" },
  red: { bg: "bg-red-50", text: "text-red-700" },
  violet: { bg: "bg-violet-50", text: "text-violet-700" },
};

// ─────────────────────────────────────────────────────────────
// School identity form
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

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

  return (
    <>
      <PageHeader
        title="Settings"
        description="Everything you need to configure the school"
      />

      {/* Link groups */}
      {GROUPS.map((group) => (
        <div key={group.title} className="mb-8">
          <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide mb-3">
            {group.title}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.cards.map((card) => {
              const Icon = card.icon;
              const tone = TONE_MAP[card.tone];
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  className={cn(
                    "group flex items-start gap-4 p-4 rounded-xl border border-ink-200 bg-white",
                    "hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5",
                    "transition-all duration-200",
                  )}>
                  <div
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-lg grid place-items-center transition-transform group-hover:scale-105",
                      tone.bg,
                      tone.text,
                    )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-ink-900">
                        {card.label}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      {card.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* School identity form */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">
          School Identity & Policies
        </h2>
      </div>

      {loading ? (
        <div className="text-sm text-ink-500">Loading…</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
      )}
    </>
  );
}
