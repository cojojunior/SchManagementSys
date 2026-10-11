import { useCallback, useEffect, useState } from "react";
import { Calendar, CheckCircle2, Plus, Trash2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RoleGate } from "@/features/auth/RoleGate";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AcademicYearFormDialog } from "./AcademicYearFormDialog";
import { TermFormDialog } from "./TermFormDialog";
import { academicYearsService } from "@/services/supabase/academic-years";
import type { AcademicYear, AcademicTerm } from "@/types/academic-year";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    kind: "year" | "term";
    id: string;
    name: string;
  } | null>(null);
  const [working, setWorking] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [ys, ts] = await Promise.all([
      academicYearsService.listYears(),
      academicYearsService.listTerms(),
    ]);
    setYears(ys);
    setTerms(ts);
    setSelectedYearId(
      (prev) => prev ?? ys.find((y) => y.isCurrent)?.id ?? ys[0]?.id ?? null,
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectedYear = years.find((y) => y.id === selectedYearId) ?? null;
  const yearTerms = terms.filter((t) => t.academicYearId === selectedYearId);

  async function handleDelete() {
    if (!confirmDelete) return;
    setWorking(true);
    try {
      if (confirmDelete.kind === "year") {
        await academicYearsService.removeYear(confirmDelete.id);
        if (selectedYearId === confirmDelete.id) setSelectedYearId(null);
      } else {
        await academicYearsService.removeTerm(confirmDelete.id);
      }
      setConfirmDelete(null);
      await reload();
    } finally {
      setWorking(false);
    }
  }

  async function handleSetCurrentYear(id: string) {
    await academicYearsService.setCurrentYear(id);
    await reload();
  }

  async function handleSetCurrentTerm(id: string) {
    await academicYearsService.setCurrentTerm(id);
    await reload();
  }

  return (
    <>
      <PageHeader
        title="Academic Years & Terms"
        description="Configure the school's academic calendar"
        action={
          <RoleGate resource="academic_years" action="create">
            <Button
              onClick={() => {
                setEditingYear(null);
                setYearDialogOpen(true);
              }}>
              <Plus className="h-4 w-4" />
              Add academic year
            </Button>
          </RoleGate>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Years list */}
        <Card className="lg:col-span-1">
          <CardHeader title="Academic years" />
          <CardBody className="p-2">
            {loading ? (
              <div className="p-4 text-sm text-ink-500">Loading…</div>
            ) : years.length === 0 ? (
              <div className="p-4 text-sm text-ink-500">No years yet.</div>
            ) : (
              <ul className="space-y-1">
                {years.map((y) => {
                  const active = y.id === selectedYearId;
                  return (
                    <li key={y.id}>
                      <button
                        onClick={() => setSelectedYearId(y.id)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          active
                            ? "bg-brand-50 text-brand-700"
                            : "hover:bg-ink-100",
                        )}>
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span className="flex-1 min-w-0 truncate font-medium">
                          {y.name}
                        </span>
                        {y.isCurrent && (
                          <Badge tone="success" className="shrink-0">
                            Current
                          </Badge>
                        )}
                        {y.status === "closed" && (
                          <Badge tone="neutral" className="shrink-0">
                            Closed
                          </Badge>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Selected year detail */}
        <Card className="lg:col-span-2">
          {!selectedYear ? (
            <CardBody>
              <p className="text-sm text-ink-500">
                Select an academic year to view and manage its terms.
              </p>
            </CardBody>
          ) : (
            <>
              <CardHeader
                title={selectedYear.name}
                description={`${formatDate(selectedYear.startDate)} – ${formatDate(selectedYear.endDate)}`}
                action={
                  <div className="flex items-center gap-2">
                    {!selectedYear.isCurrent && (
                      <RoleGate resource="academic_years" action="update">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetCurrentYear(selectedYear.id)}>
                          <CheckCircle2 className="h-4 w-4" />
                          Set current
                        </Button>
                      </RoleGate>
                    )}
                    <RoleGate resource="academic_years" action="update">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingYear(selectedYear);
                          setYearDialogOpen(true);
                        }}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </RoleGate>
                    <RoleGate resource="academic_years" action="delete">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          setConfirmDelete({
                            kind: "year",
                            id: selectedYear.id,
                            name: selectedYear.name,
                          })
                        }>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </RoleGate>
                  </div>
                }
              />
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-ink-900">
                      Terms
                    </div>
                    <div className="text-xs text-ink-500">
                      {yearTerms.length} term{yearTerms.length === 1 ? "" : "s"}{" "}
                      configured
                    </div>
                  </div>
                  <RoleGate resource="terms" action="create">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingTerm(null);
                        setTermDialogOpen(true);
                      }}>
                      <Plus className="h-4 w-4" />
                      Add term
                    </Button>
                  </RoleGate>
                </div>

                {yearTerms.length === 0 ? (
                  <p className="text-sm text-ink-500">
                    No terms yet. Add Term 1, 2, and 3 for this academic year.
                  </p>
                ) : (
                  <ul className="divide-y divide-ink-200 border border-ink-200 rounded-lg">
                    {yearTerms.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink-900">
                              {t.name}
                            </span>
                            {t.isCurrent && (
                              <Badge tone="success">Current</Badge>
                            )}
                          </div>
                          <div className="text-xs text-ink-500 mt-0.5">
                            {formatDate(t.startDate)} – {formatDate(t.endDate)}
                          </div>
                        </div>
                        {!t.isCurrent && (
                          <RoleGate resource="terms" action="update">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetCurrentTerm(t.id)}>
                              Set current
                            </Button>
                          </RoleGate>
                        )}
                        <RoleGate resource="terms" action="update">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTerm(t);
                              setTermDialogOpen(true);
                            }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </RoleGate>
                        <RoleGate resource="terms" action="delete">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfirmDelete({
                                kind: "term",
                                id: t.id,
                                name: t.name,
                              })
                            }>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </RoleGate>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </>
          )}
        </Card>
      </div>

      <AcademicYearFormDialog
        open={yearDialogOpen}
        onClose={() => setYearDialogOpen(false)}
        editing={editingYear}
        onSaved={() => {
          setYearDialogOpen(false);
          void reload();
        }}
      />

      {selectedYear && (
        <TermFormDialog
          open={termDialogOpen}
          onClose={() => setTermDialogOpen(false)}
          academicYearId={selectedYear.id}
          editing={editingTerm}
          onSaved={() => {
            setTermDialogOpen(false);
            void reload();
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={working}
        title={`Delete ${confirmDelete?.kind === "year" ? "academic year" : "term"}?`}
        message={
          confirmDelete?.kind === "year"
            ? `Deleting ${confirmDelete.name} also removes its terms. In production, this preserves historical data and only archives the year.`
            : `Delete ${confirmDelete?.name}? This cannot be undone in demo mode.`
        }
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
