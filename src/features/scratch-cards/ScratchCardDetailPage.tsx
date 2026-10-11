import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { RoleGate } from "@/features/auth/RoleGate";
import { useAuth } from "@/features/auth/AuthContext";
import { useLookup } from "@/hooks/useLookup";
import { scratchCardsService } from "@/services/scratch-cards";
import { studentsService } from "@/services/students";
import type { ScratchCard, ScratchCardUsage } from "@/types/scratch-card";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_TONE: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info" | "brand"
> = {
  unused: "success",
  partially_used: "info",
  exhausted: "neutral",
  invalidated: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  unused: "Unused",
  partially_used: "Partially used",
  exhausted: "Exhausted",
  invalidated: "Invalidated",
};

export default function ScratchCardDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [card, setCard] = useState<ScratchCard | null>(null);
  const [usages, setUsages] = useState<ScratchCardUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueStudentId, setIssueStudentId] = useState("");
  const { data: students } = useLookup(async () => {
    const res = await studentsService.list({ status: "active" }, 1, 500);
    return res.data;
  });

  const [invalidateOpen, setInvalidateOpen] = useState(false);
  const [invalidateReason, setInvalidateReason] = useState("");

  async function reload() {
    setLoading(true);
    const [c, u] = await Promise.all([
      scratchCardsService.get(id),
      scratchCardsService.listUsages(id),
    ]);
    setCard(c);
    setUsages(u);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleIssue() {
    if (!card || !issueStudentId || !user) return;
    setWorking(true);
    try {
      await scratchCardsService.issue(card.id, issueStudentId, user.fullName);
      setIssueOpen(false);
      setIssueStudentId("");
      await reload();
    } finally {
      setWorking(false);
    }
  }

  async function handleInvalidate() {
    if (!card || !invalidateReason) return;
    setWorking(true);
    try {
      await scratchCardsService.invalidate(card.id, invalidateReason);
      setInvalidateOpen(false);
      setInvalidateReason("");
      await reload();
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!card) {
    return (
      <EmptyState
        title="Scratch card not found"
        action={
          <Link to="..">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    );
  }

  const canIssue = card.status !== "invalidated" && !card.issuedToStudentId;
  const canInvalidate = card.status !== "invalidated";

  return (
    <>
      <PageHeader
        title={card.serialNumber}
        description={`${card.division.toUpperCase()} · ${card.termName} ${card.academicYear}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {canIssue && (
              <RoleGate resource="scratch_cards" action="update">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIssueOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Issue to student
                </Button>
              </RoleGate>
            )}
            {canInvalidate && (
              <RoleGate resource="scratch_cards" action="update">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setInvalidateOpen(true)}>
                  <Ban className="h-4 w-4" />
                  Invalidate
                </Button>
              </RoleGate>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Card details" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Serial number" value={card.serialNumber} mono />
            <Field label="PIN" value={card.maskedPin} mono />
            <Field label="Division" value={card.division.toUpperCase()} />
            <Field
              label="Term"
              value={`${card.termName} ${card.academicYear}`}
            />
            <Field label="Price" value={formatCurrency(card.price)} />
            <div>
              <div className="text-xs text-ink-500 mb-1">Uses remaining</div>
              <div className="text-sm font-semibold tabular-nums">
                {card.usesRemaining} / 3
              </div>
            </div>
            <Field
              label="Issued to"
              value={card.issuedToStudentName ?? "Unassigned"}
            />
            <Field
              label="Issued at"
              value={card.issuedAt ? formatDate(card.issuedAt) : "—"}
            />
            <Field label="Issued by" value={card.issuedBy ?? "—"} />
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-500 mb-1">Status</div>
              <Badge tone={STATUS_TONE[card.status] ?? "neutral"}>
                {STATUS_LABEL[card.status] ?? card.status}
              </Badge>
            </div>
            {card.invalidatedAt && (
              <>
                <Field
                  label="Invalidated at"
                  value={formatDate(card.invalidatedAt)}
                />
                <Field
                  label="Invalidation reason"
                  value={card.invalidatedReason ?? "—"}
                />
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Usage rules" />
          <CardBody className="space-y-3 text-sm text-ink-600">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Maximum of <strong>3 successful result requests</strong>.
              </li>
              <li>
                Valid for <strong>one term only</strong>.
              </li>
              <li>Cannot be used across divisions or academic years.</li>
              <li>Invalidated cards are permanently blocked.</li>
              <li>Usage counting is enforced server-side in production.</li>
            </ul>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Usage history"
            description={`${usages.length} successful use${usages.length === 1 ? "" : "s"}`}
          />
          <CardBody className="p-0">
            {usages.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-500">
                This card has not been used yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Date & time
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Student
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">Term</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {usages.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-2 text-ink-500">
                        {new Date(u.accessedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 font-medium text-ink-900">
                        {u.studentName}
                      </td>
                      <td className="px-4 py-2 text-ink-600">{u.termName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Issue dialog */}
      <Dialog
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Issue to student"
        description="Assign this card to a specific student. The card can then be redeemed for that student's results."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIssueOpen(false)}
              disabled={working}>
              Cancel
            </Button>
            <Button onClick={handleIssue} disabled={working || !issueStudentId}>
              {working ? "Issuing…" : "Issue card"}
            </Button>
          </>
        }>
        <FormField label="Student" required>
          <Select
            value={issueStudentId}
            onChange={(e) => setIssueStudentId(e.target.value)}>
            <option value="">Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} — {s.className}
              </option>
            ))}
          </Select>
        </FormField>
      </Dialog>

      {/* Invalidate dialog */}
      <Dialog
        open={invalidateOpen}
        onClose={() => setInvalidateOpen(false)}
        title="Invalidate scratch card"
        description="Invalidated cards cannot be redeemed. This action is logged."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setInvalidateOpen(false)}
              disabled={working}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleInvalidate}
              disabled={working || !invalidateReason}>
              {working ? "Invalidating…" : "Invalidate card"}
            </Button>
          </>
        }>
        <FormField
          label="Reason"
          required
          hint="e.g. Damaged during printing, lost, fraud-suspected">
          <Textarea
            value={invalidateReason}
            onChange={(e) => setInvalidateReason(e.target.value)}
            placeholder="Explain why this card is being invalidated"
          />
        </FormField>
      </Dialog>
    </>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div className={`text-sm text-ink-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
