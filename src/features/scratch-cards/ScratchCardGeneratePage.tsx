import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { useLookup } from "@/hooks/useLookup";
import { academicYearsService } from "@/services/academic-years";
import { scratchCardsService } from "@/services/scratch-cards";
import { SCRATCH_CARD_PRICES } from "@/types/scratch-card";
import type { Division } from "@/types/common";
import { formatCurrency } from "@/lib/format";

const schema = z.object({
  division: z.enum(["nursery", "kg", "primary", "jhs"]),
  termId: z.string().min(1, "Term is required"),
  academicYear: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(200),
  priceOverride: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

type GeneratedCard = {
  id: string;
  serialNumber: string;
  rawPin: string;
  division: string;
  termName: string;
  price: number;
};

export default function ScratchCardGeneratePage() {
  const navigate = useNavigate();
  const { data: terms } = useLookup(() => academicYearsService.listTerms());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      division: "jhs",
      academicYear: "2024/2025",
      quantity: 10,
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [generated, setGenerated] = useState<GeneratedCard[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const division = form.watch("division") as Division;
  const priceOverride = form.watch("priceOverride");
  const effectivePrice = priceOverride ?? SCRATCH_CARD_PRICES[division];

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const cards = await scratchCardsService.generate(values);
      setGenerated(
        cards.map((c) => ({
          id: c.id,
          serialNumber: c.serialNumber,
          rawPin: c.rawPin,
          division: c.division,
          termName: c.termName,
          price: c.price,
        })),
      );
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadCsv() {
    if (!generated) return;
    const rows = [
      ["Serial", "PIN", "Division", "Term", "Price (GHS)"],
      ...generated.map((c) => [
        c.serialNumber,
        c.rawPin,
        c.division,
        c.termName,
        c.price.toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scratch-cards-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  return (
    <>
      <PageHeader
        title={generated ? "Generated Cards" : "Generate Scratch Cards"}
        description={
          generated
            ? `${generated.length} cards created — save the PINs now, they will not be shown again.`
            : "Create a batch of scratch cards for a specific division and term"
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {generated && (
              <>
                <Button variant="secondary" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadCsv}>
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              </>
            )}
          </div>
        }
      />

      {!generated ? (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
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
                <FormField label="Term" required error={errors.termId?.message}>
                  <Select {...register("termId")} invalid={!!errors.termId}>
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
                  <Input
                    {...register("academicYear")}
                    invalid={!!errors.academicYear}
                  />
                </FormField>
                <FormField
                  label="Quantity"
                  required
                  error={errors.quantity?.message}
                  hint="1–200 cards per batch">
                  <Input
                    type="number"
                    {...register("quantity")}
                    invalid={!!errors.quantity}
                  />
                </FormField>
                <FormField
                  label="Price override (GH₵)"
                  hint={`Default for this division: ${formatCurrency(SCRATCH_CARD_PRICES[division])}`}
                  error={errors.priceOverride?.message}
                  className="sm:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={String(SCRATCH_CARD_PRICES[division])}
                    {...register("priceOverride")}
                  />
                </FormField>
              </div>

              <div className="rounded-lg bg-ink-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Effective price per card</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(effectivePrice)}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Generating…" : "Generate cards"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={`${generated.length} cards generated`}
            description="⚠️ These PINs are shown ONCE. Save or print them now."
          />
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">#</th>
                  <th className="text-left px-4 py-2.5 font-medium">Serial</th>
                  <th className="text-left px-4 py-2.5 font-medium">PIN</th>
                  <th className="text-left px-4 py-2.5 font-medium">
                    Division
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium">Term</th>
                  <th className="text-right px-4 py-2.5 font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {generated.map((c, i) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 text-ink-400 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {c.serialNumber}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm font-semibold">
                      {c.rawPin}
                    </td>
                    <td className="px-4 py-2 uppercase">{c.division}</td>
                    <td className="px-4 py-2">{c.termName}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatCurrency(c.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </>
  );
}
