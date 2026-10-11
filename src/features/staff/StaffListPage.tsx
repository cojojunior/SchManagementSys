import { useCallback } from "react";
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
import { RoleGate } from "@/features/auth/RoleGate";
import { useList } from "@/hooks/useList";
import { staffService } from "@/services/staff";
import type { Staff, StaffFilters } from "@/types/staff";
import { ROLE_LABELS } from "@/lib/constants";

const PAGE_SIZE = 10;

const INITIAL_FILTERS: StaffFilters = {
  search: "",
  category: "all",
  employmentStatus: "all",
  accountStatus: "all",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};

const CATEGORY_LABELS: Record<string, string> = {
  teaching: "Teaching",
  non_teaching: "Non-teaching",
};

export default function StaffListPage() {
  const fetcher = useCallback(
    (f: StaffFilters, p: number, ps: number) => staffService.list(f, p, ps),
    [],
  );

  const list = useList<Staff, StaffFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Staff"
        description={`${list.total} staff member${list.total === 1 ? "" : "s"}`}
        action={
          <RoleGate resource="staff" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Add staff
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
              placeholder="Search by name, staff ID, email, job title…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.category}
            onChange={(e) =>
              list.setFilters({
                category: e.target.value as StaffFilters["category"],
              })
            }
            className="md:w-44">
            <option value="all">All categories</option>
            <option value="teaching">Teaching</option>
            <option value="non_teaching">Non-teaching</option>
          </Select>
          <Select
            value={list.filters.employmentStatus}
            onChange={(e) =>
              list.setFilters({
                employmentStatus: e.target
                  .value as StaffFilters["employmentStatus"],
              })
            }
            className="md:w-40">
            <option value="all">All employment</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
          </Select>
          <Select
            value={list.filters.accountStatus}
            onChange={(e) =>
              list.setFilters({
                accountStatus: e.target.value as StaffFilters["accountStatus"],
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
              <TH>Staff ID</TH>
              <TH>Name</TH>
              <TH>Job title</TH>
              <TH>Category</TH>
              <TH>Employment</TH>
              <TH>Portal role</TH>
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
                  <Users className="h-6 w-6 text-ink-400" />
                  <span>No staff match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((s) => (
                <TR key={s.id}>
                  <TD className="font-mono text-xs">{s.staffId}</TD>
                  <TD>
                    <Link
                      to={s.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {s.firstName} {s.lastName}
                    </Link>
                  </TD>
                  <TD>{s.jobTitle}</TD>
                  <TD>
                    <Badge
                      tone={s.category === "teaching" ? "info" : "neutral"}>
                      {CATEGORY_LABELS[s.category]}
                    </Badge>
                  </TD>
                  <TD className="text-ink-500">
                    {EMPLOYMENT_LABELS[s.employmentStatus]}
                  </TD>
                  <TD>
                    {s.systemRole ? (
                      <Badge tone="brand">{ROLE_LABELS[s.systemRole]}</Badge>
                    ) : (
                      <span className="text-ink-400 text-xs">No access</span>
                    )}
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        s.accountStatus === "active" ? "success" : "neutral"
                      }>
                      {s.accountStatus}
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
