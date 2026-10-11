import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, ClipboardCheck } from "lucide-react";
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
import { useList } from "@/hooks/useList";
import { useLookup } from "@/hooks/useLookup";
import { resultsService } from "@/services/results";
import { classesService } from "@/services/classes";
import { subjectsService } from "@/services/subjects";
import type { AssessmentResult, ResultFilters } from "@/types/result";

const PAGE_SIZE = 10;

const INITIAL_FILTERS: ResultFilters = {
  search: "",
  status: "all",
  classId: "all",
  subjectId: "all",
  termId: "all",
};

const STATUS_TONE: Record<
  string,
  "neutral" | "warning" | "info" | "success" | "danger" | "brand"
> = {
  draft: "neutral",
  submitted: "info",
  returned: "warning",
  approved: "brand",
  published: "success",
  locked: "danger",
};

export default function ResultsListPage() {
  const fetcher = useCallback(
    (f: ResultFilters, p: number, ps: number) => resultsService.list(f, p, ps),
    [],
  );

  const list = useList<AssessmentResult, ResultFilters>({
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
        title="Results"
        description={`${list.total} result${list.total === 1 ? "" : "s"}`}
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
                classId: e.target.value as ResultFilters["classId"],
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
                subjectId: e.target.value as ResultFilters["subjectId"],
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
                status: e.target.value as ResultFilters["status"],
              })
            }
            className="lg:w-40">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="returned">Returned</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
          </Select>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Class</TH>
              <TH>Subject</TH>
              <TH>Term</TH>
              <TH>Teacher</TH>
              <TH>Students</TH>
              <TH>Average</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={8}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : list.data.length === 0 ? (
              <TableEmpty colSpan={8}>
                <div className="flex flex-col items-center gap-2">
                  <ClipboardCheck className="h-6 w-6 text-ink-400" />
                  <span>No results match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((r) => (
                <TR key={r.assessmentId}>
                  <TD>
                    <Link
                      to={r.assessmentId}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {r.className}
                    </Link>
                  </TD>
                  <TD>
                    <span className="font-mono text-xs text-ink-500 mr-2">
                      {r.subjectCode}
                    </span>
                    {r.subjectName}
                  </TD>
                  <TD>
                    {r.termName}
                    <div className="text-xs text-ink-500">{r.academicYear}</div>
                  </TD>
                  <TD>{r.teacherName ?? "—"}</TD>
                  <TD className="tabular-nums">{r.studentCount}</TD>
                  <TD className="tabular-nums">
                    {r.studentCount > 0 ? `${r.classAverage.toFixed(1)}%` : "—"}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>
                      {r.status}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Link to={r.assessmentId}>
                      <Button variant="ghost" size="sm">
                        Review
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
