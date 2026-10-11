import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, BookOpen } from "lucide-react";
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
import { subjectsService } from "@/services/supabase/subjects";
import type { Subject, SubjectFilters } from "@/types/subjects";

const PAGE_SIZE = 10;

const INITIAL_FILTERS: SubjectFilters = {
  search: "",
  division: "all",
  status: "all",
};

const DIVISION_LABELS: Record<string, string> = {
  nursery: "Nursery",
  kg: "KG",
  primary: "Primary",
  jhs: "JHS",
};

export default function SubjectListPage() {
  const fetcher = useCallback(
    (f: SubjectFilters, p: number, ps: number) =>
      subjectsService.list(f, p, ps),
    [],
  );

  const list = useList<Subject, SubjectFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Subjects"
        description={`${list.total} subject${list.total === 1 ? "" : "s"}`}
        action={
          <RoleGate resource="subjects" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Add subject
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
              placeholder="Search by name or code…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.division}
            onChange={(e) =>
              list.setFilters({
                division: e.target.value as SubjectFilters["division"],
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
                status: e.target.value as SubjectFilters["status"],
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
              <TH>Code</TH>
              <TH>Name</TH>
              <TH>Divisions</TH>
              <TH>Type</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={6}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : list.data.length === 0 ? (
              <TableEmpty colSpan={6}>
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-6 w-6 text-ink-400" />
                  <span>No subjects match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((s) => (
                <TR key={s.id}>
                  <TD className="font-mono text-xs">{s.code}</TD>
                  <TD>
                    <Link
                      to={s.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {s.name}
                    </Link>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {s.divisions.map((d) => (
                        <Badge key={d} tone="info">
                          {DIVISION_LABELS[d] ?? d}
                        </Badge>
                      ))}
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={s.isCore ? "brand" : "neutral"}>
                      {s.isCore ? "Core" : "Elective"}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge tone={s.status === "active" ? "success" : "neutral"}>
                      {s.status}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Link to={s.id}>
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
