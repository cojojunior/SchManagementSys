import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
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
import { studentsService } from "@/services/supabase/student";
import type { Student, StudentFilters } from "@/types/student";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 10;

export default function StudentListPage() {
  const [filters, setFilters] = useState<StudentFilters>({
    search: "",
    division: "all",
    status: "all",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);

  // Debounce search
  const debouncedSearch = useDebounced(filters.search ?? "", 250);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    studentsService
      .list({ ...filters, search: debouncedSearch }, page, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setStudents(res.data);
        setTotal(res.total);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filters.division, filters.status, page]);

  const divisionCounts = useMemo(() => {
    return {
      all: total,
    };
  }, [total]);

  return (
    <>
      <PageHeader
        title="Students"
        description={`${total} record${total === 1 ? "" : "s"} · showing ${divisionCounts.all}`}
        action={
          <Link to="/admin/students/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add student
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="p-4 border-b border-ink-200 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search by name, admission number, class…"
              className="pl-9"
              value={filters.search ?? ""}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, search: e.target.value }));
              }}
            />
          </div>
          <Select
            value={filters.division}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({
                ...f,
                division: e.target.value as StudentFilters["division"],
              }));
            }}
            className="md:w-44">
            <option value="all">All divisions</option>
            <option value="nursery">Nursery</option>
            <option value="primary">Primary</option>
            <option value="jhs">JHS</option>
          </Select>
          <Select
            value={filters.status}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({
                ...f,
                status: e.target.value as StudentFilters["status"],
              }));
            }}
            className="md:w-44">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Admission #</TH>
              <TH>Name</TH>
              <TH>Class</TH>
              <TH>Division</TH>
              <TH>Status</TH>
              <TH>Admitted</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={7}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : students.length === 0 ? (
              <TableEmpty colSpan={7}>
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6 text-ink-400" />
                  <span>No students match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              students.map((s) => (
                <TR key={s.id}>
                  <TD className="font-mono text-xs">{s.admissionNumber}</TD>
                  <TD>
                    <Link
                      to={`/admin/students/${s.id}`}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {s.firstName} {s.lastName}
                    </Link>
                  </TD>
                  <TD>{s.className}</TD>
                  <TD className="capitalize">{s.division}</TD>
                  <TD>
                    <Badge
                      tone={
                        s.status === "active"
                          ? "success"
                          : s.status === "inactive"
                            ? "warning"
                            : "neutral"
                      }>
                      {s.status}
                    </Badge>
                  </TD>
                  <TD className="text-ink-500">
                    {formatDate(s.admissionDate)}
                  </TD>
                  <TD className="text-right">
                    <Link to={`/admin/students/${s.id}`}>
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
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </Card>
    </>
  );
}

// Local hook — small enough not to warrant its own file yet
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
