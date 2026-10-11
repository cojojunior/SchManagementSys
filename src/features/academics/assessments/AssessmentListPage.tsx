import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TableEmpty,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { RoleGate } from "@/features/auth/RoleGate";
import { useList } from "@/hooks/useList";
import { useLookup } from "@/hooks/useLookup";
import { assessmentsService } from "@/services/assessments";
import { classesService } from "@/services/classes";
import { subjectsService } from "@/services/subjects";
import type { Assessment, AssessmentFilters } from "@/types/assessment";

const PAGE_SIZE = 10;

const INITIAL_FILTERS: AssessmentFilters = {
  search: "",
  classId: "all",
  subjectId: "all",
  termId: "all",
  academicYear: "all",
  status: "all",
};

const STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "info"> =
  {
    draft: "neutral",
    open: "info",
    closed: "success",
  };

export default function AssessmentListPage() {
  const fetcher = useCallback(
    (f: AssessmentFilters, p: number, ps: number) =>
      assessmentsService.list(f, p, ps),
    [],
  );

  const list = useList<Assessment, AssessmentFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  const { data: classes } = useLookup(async () => {
    const res = await classesService.list({}, 1, 200);
    return res.data;
  });
  const { data: subjects } = useLookup(async () => {
    const res = await subjectsService.list({}, 1, 200);
    return res.data;
  });

  return (
    <>
      <PageHeader
        title="Assessments"
        description={`${list.total} assessment${list.total === 1 ? "" : "s"}`}
        action={
          <RoleGate resource="assessments" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Add assessment
              </Button>
            </Link>
          </RoleGate>
        }
      />

      <Card>
        <div className="p-4 border-b border-ink-200 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search by class, subject, term, teacher…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.classId}
            onChange={(e) =>
              list.setFilters({
                classId: e.target.value as AssessmentFilters["classId"],
              })
            }
            className="lg:w-40">
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={list.filters.subjectId}
            onChange={(e) =>
              list.setFilters({
                subjectId: e.target.value as AssessmentFilters["subjectId"],
              })
            }
            className="lg:w-44">
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            value={list.filters.status}
            onChange={(e) =>
              list.setFilters({
                status: e.target.value as AssessmentFilters["status"],
              })
            }
            className="lg:w-36">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Class</TH>
              <TH>Subject</TH>
              <TH>Term</TH>
              <TH>Teacher</TH>
              <TH>Score split</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={7}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : list.data.length === 0 ? (
              <TableEmpty colSpan={7}>
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-6 w-6 text-ink-400" />
                  <span>No assessments match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((a) => (
                <TR key={a.id}>
                  <TD>
                    <Link
                      to={a.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {a.className}
                    </Link>
                  </TD>
                  <TD>
                    <span className="font-mono text-xs text-ink-500 mr-2">
                      {a.subjectCode}
                    </span>
                    {a.subjectName}
                  </TD>
                  <TD>
                    {a.termName}
                    <div className="text-xs text-ink-500">{a.academicYear}</div>
                  </TD>
                  <TD>
                    {a.teacherName ?? <span className="text-ink-400">—</span>}
                  </TD>
                  <TD className="tabular-nums text-ink-500">
                    {a.maxAssessmentScore} / {a.maxExamScore}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>
                      {a.status}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Link to={a.id}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          onPageChange={list.setPage}
        />
      </Card>
    </>
  );
}
