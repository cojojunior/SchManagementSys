import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, School } from "lucide-react";
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
import { classesService } from "@/services/classes";
import type { SchoolClass, ClassFilters } from "@/types/class";

const PAGE_SIZE = 10;

const INITIAL_FILTERS: ClassFilters = {
  search: "",
  division: "all",
  status: "all",
  academicYear: "all",
};

export default function ClassListPage() {
  const fetcher = useCallback(
    (f: ClassFilters, p: number, ps: number) => classesService.list(f, p, ps),
    [],
  );

  const list = useList<SchoolClass, ClassFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Classes"
        description={`${list.total} class${list.total === 1 ? "" : "es"}`}
        action={
          <RoleGate resource="classes" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Add class
              </Button>
            </Link>
          </RoleGate>
        }
      />

      <Card>
        <div className="p-4 border-b border-ink-200 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search by class name or teacher…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.division}
            onChange={(e) =>
              list.setFilters({
                division: e.target.value as ClassFilters["division"],
              })
            }
            className="md:w-40">
            <option value="all">All divisions</option>
            <option value="nursery">Nursery</option>
            <option value="kg">KG</option>
            <option value="primary">Primary</option>
            <option value="jhs">JHS</option>
          </Select>
          <Select
            value={list.filters.status}
            onChange={(e) =>
              list.setFilters({
                status: e.target.value as ClassFilters["status"],
              })
            }
            className="md:w-40">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Class</TH>
              <TH>Division</TH>
              <TH>Class teacher</TH>
              <TH>Students</TH>
              <TH>Capacity</TH>
              <TH>Academic year</TH>
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
                  <School className="h-6 w-6 text-ink-400" />
                  <span>No classes match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link
                      to={c.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {c.name}
                    </Link>
                  </TD>
                  <TD className="uppercase">{c.division}</TD>
                  <TD>
                    {c.classTeacherName ?? (
                      <span className="text-ink-400">—</span>
                    )}
                  </TD>
                  <TD className="tabular-nums">{c.studentCount}</TD>
                  <TD className="tabular-nums text-ink-500">{c.capacity}</TD>
                  <TD className="text-ink-500">{c.academicYear}</TD>
                  <TD>
                    <Badge tone={c.status === "active" ? "success" : "neutral"}>
                      {c.status}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Link to={c.id}>
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
