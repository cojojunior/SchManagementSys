import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleGate } from "@/features/auth/RoleGate";
import { feeStructuresService } from "@/services/fee-structure";
import type { FeeStructure } from "@/types/finance";
import { formatCurrency } from "@/lib/format";

const CATEGORY_LABELS: Record<string, string> = {
  tuition: "Tuition",
  feeding: "Feeding",
  transport: "Transport",
  books: "Books",
  uniform: "Uniform",
  result_access: "Result Access",
  other: "Other",
};

export default function FeeStructureDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [structure, setStructure] = useState<FeeStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    feeStructuresService.get(id).then((s) => {
      setStructure(s);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await feeStructuresService.remove(id);
      navigate(-1);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!structure) {
    return (
      <EmptyState
        title="Fee structure not found"
        action={
          <Link to="..">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={structure.name}
        description={`${structure.division.toUpperCase()} · ${structure.termName} · ${structure.academicYear}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <RoleGate resource="fees" action="update">
              <Link to="edit">
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </RoleGate>
            <RoleGate resource="fees" action="delete">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </RoleGate>
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader
          title="Fee items"
          description={`${structure.items.length} line item${structure.items.length === 1 ? "" : "s"}`}
          action={
            <Badge tone={structure.status === "active" ? "success" : "neutral"}>
              {structure.status}
            </Badge>
          }
        />
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Item</th>
                <th className="text-left px-4 py-2.5 font-medium">Category</th>
                <th className="text-right px-4 py-2.5 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {structure.items.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-2">
                    <div className="font-medium text-ink-900">{i.name}</div>
                    {i.description && (
                      <div className="text-xs text-ink-500">
                        {i.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink-600">
                    {CATEGORY_LABELS[i.category] ?? i.category}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(i.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-ink-50">
                <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                  Total
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-lg">
                  {formatCurrency(structure.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete fee structure?"
        message="This removes the structure from the current list. In production, existing invoices generated from it are preserved."
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
