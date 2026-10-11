import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ClipboardList } from "lucide-react";
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
import { teachingAssignmentsService } from "@/services/supabase/teaching-assignments";
import { staffService } from "@/services/staff";
import { classesService } from "@/services/classes";
import { subjectsService } from "@/services/subjects";
import type {
  TeachingAssignment,
  TeachingAssignmentFilters,
} from "@/types/teaching-assignment";

const PAGE_SIZE = 10;

const INITIAL_FILTERS: TeachingAssignmentFilters = {
  search: "",
  staffId: "all",
  classId: "all",
  subjectId: "all",
  academicYear: "all",
  isActive: "all",
};

export default function AssignmentListPage() {
  const fetcher = useCallback(
    (f: TeachingAssignmentFilters, p: number, ps: number) =>
      teachingAssignmentsService.list(f, p, ps),
    [],
  );

  const list = useList<TeachingAssignment, TeachingAssignmentFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  // Lookups for filter dropdowns
  const { data: staff } = useLookup(async () => {
    const res = await staffService.list({}, 1, 200);
    return res.data;
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
        title="Teaching Assignments"
        description={`${list.total} assignment${list.total === 1 ? "" : "s"}`}
        action={
          <RoleGate resource="teaching_assignments" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Add assignment
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
              placeholder="Search by teacher, class, or subject…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.staffId}
            onChange={(e) =>
              list.setFilters({
                staffId: e.target.value as TeachingAssignmentFilters["staffId"],
              })
            }
            className="lg:w-56">
            <option value="all">All teachers</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </Select>
          <Select
            value={list.filters.classId}
            onChange={(e) =>
              list.setFilters({
                classId: e.target.value as TeachingAssignmentFilters["classId"],
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
                subjectId: e.target
                  .value as TeachingAssignmentFilters["subjectId"],
              })
            }
            className="lg:w-48">
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Teacher</TH>
              <TH>Class</TH>
              <TH>Subject</TH>
              <TH>Academic year</TH>
              <TH>Periods/wk</TH>
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
                  <ClipboardList className="h-6 w-6 text-ink-400" />
                  <span>No assignments match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((a) => (
                <TR key={a.id}>
                  <TD>
                    <Link
                      to={a.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {a.staffName}
                    </Link>
                  </TD>
                  <TD>{a.className}</TD>
                  <TD>
                    <span className="font-mono text-xs text-ink-500 mr-2">
                      {a.subjectCode}
                    </span>
                    {a.subjectName}
                  </TD>
                  <TD className="text-ink-500">{a.academicYear}</TD>
                  <TD className="tabular-nums">{a.periodsPerWeek ?? "—"}</TD>
                  <TD>
                    <Badge tone={a.isActive ? "success" : "neutral"}>
                      {a.isActive ? "Active" : "Inactive"}
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
