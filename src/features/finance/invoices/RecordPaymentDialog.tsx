import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/features/auth/AuthContext";
import { invoicesService } from "@/services/supabase/invoices";
import type { Invoice } from "@/types/finance";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

const schema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["cash", "momo", "bank_transfer", "cheque", "pos", "other"]),
  reference: z.string().optional(),
  paidAt: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function RecordPaymentDialog({
  open,
  onClose,
  invoice,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: invoice.balance,
      method: "cash",
      paidAt: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      amount: invoice.balance,
      method: "cash",
      reference: "",
      paidAt: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setFormError(null);
  }, [open, invoice, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      await invoicesService.recordPayment(
        invoice.id,
        values.amount,
        values.method,
        values.reference || undefined,
        user?.fullName ?? "System",
        new Date(values.paidAt + "T12:00:00").toISOString(),
        values.notes,
      );
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
      title="Record payment"
      description={`${invoice.invoiceNumber} · Balance: ${formatCurrency(invoice.balance)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="payment-form" disabled={submitting}>
            {submitting ? "Saving…" : "Record payment"}
          </Button>
        </>
      }>
      <form
        id="payment-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4">
        <FormField
          label={`Amount (${CURRENCY_SYMBOL})`}
          required
          error={errors.amount?.message}
          hint={`Maximum: ${formatCurrency(invoice.balance)}`}>
          <Input
            type="number"
            step="0.01"
            {...register("amount")}
            invalid={!!errors.amount}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Method" required error={errors.method?.message}>
            <Select {...register("method")}>
              <option value="cash">Cash</option>
              <option value="momo">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="pos">POS</option>
              <option value="other">Other</option>
            </Select>
          </FormField>
          <FormField label="Date" required error={errors.paidAt?.message}>
            <Input
              type="date"
              {...register("paidAt")}
              invalid={!!errors.paidAt}
            />
          </FormField>
          <FormField
            label="Reference"
            hint="MoMo/Bank reference (optional)"
            error={errors.reference?.message}
            className="sm:col-span-2">
            <Input placeholder="e.g. MM-0922-0001" {...register("reference")} />
          </FormField>
          <FormField
            label="Notes"
            error={errors.notes?.message}
            className="sm:col-span-2">
            <Textarea placeholder="Optional" {...register("notes")} />
          </FormField>
        </div>
        {formError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {formError}
          </div>
        )}
      </form>
    </Dialog>
  );
}
