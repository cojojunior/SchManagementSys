import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Award, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RoleGate } from "@/features/auth/RoleGate";
import { gradingService } from "@/services/supabase/grading";
import type { GradingScale } from "@/types/grading";

const DIVISION_LABELS: Record<string, string> = {
  nursery: "Nursery",
  kg: "KG",
  primary: "Primary",
  jhs: "JHS",
};

export default function GradingScalesPage() {
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gradingService.list().then((s) => {
      setScales(s);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Grading Scales"
        description="Configure the grading bands used for report cards"
        action={
          <RoleGate resource="school_settings" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Add scale
              </Button>
            </Link>
          </RoleGate>
        }
      />

      {loading ? (
        <div className="text-sm text-ink-500">Loading…</div>
      ) : scales.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <Award className="h-8 w-8 text-ink-400 mx-auto mb-3" />
              <p className="text-sm text-ink-500">
                No grading scales yet. Add one to get started.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6">
          {scales.map((scale) => (
            <Card key={scale.id}>
              <CardHeader
                title={scale.name}
                description={scale.description}
                action={
                  <div className="flex items-center gap-2">
                    {scale.isActive ? (
                      <Badge tone="success">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Inactive</Badge>
                    )}
                    <RoleGate resource="school_settings" action="update">
                      <Link to={`${scale.id}/edit`}>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </RoleGate>
                  </div>
                }
              />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {scale.divisions.map((d) => (
                    <Badge key={d} tone="info">
                      {DIVISION_LABELS[d] ?? d}
                    </Badge>
                  ))}
                  <Badge tone="brand" className="capitalize">
                    {scale.type}
                  </Badge>
                </div>

                <div className="border border-ink-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">
                          Grade
                        </th>
                        <th className="text-left px-4 py-2 font-medium">
                          Label
                        </th>
                        <th className="text-left px-4 py-2 font-medium">
                          Score range
                        </th>
                        <th className="text-left px-4 py-2 font-medium">
                          Remark
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-200">
                      {scale.bands
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((b) => (
                          <tr key={b.id}>
                            <td className="px-4 py-2 font-semibold text-ink-900">
                              {b.grade}
                            </td>
                            <td className="px-4 py-2">{b.label}</td>
                            <td className="px-4 py-2 text-ink-600 tabular-nums">
                              {b.minScore} – {b.maxScore}
                            </td>
                            <td className="px-4 py-2 text-ink-500">
                              {b.remark ?? "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
