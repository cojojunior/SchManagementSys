import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, UserCog } from "lucide-react";
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
import { usersService } from "@/services/supabase/users";
import type { UserProfile, UserFilters } from "@/types/users";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

const INITIAL_FILTERS: UserFilters = {
  search: "",
  role: "all",
  status: "all",
};

const STATUS_TONE: Record<
  string,
  "success" | "neutral" | "warning" | "danger"
> = {
  active: "success",
  inactive: "neutral",
  suspended: "warning",
  archived: "neutral",
};

export default function UserListPage() {
  const fetcher = useCallback(
    (f: UserFilters, p: number, ps: number) => usersService.list(f, p, ps),
    [],
  );

  const list = useList<UserProfile, UserFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Users & Roles"
        description={`${list.total} account${list.total === 1 ? "" : "s"}`}
        action={
          <RoleGate resource="users" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Add staff account
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
              placeholder="Search by name or email…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.role}
            onChange={(e) =>
              list.setFilters({ role: e.target.value as UserFilters["role"] })
            }
            className="md:w-44">
            <option value="all">All roles</option>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <Select
            value={list.filters.status}
            onChange={(e) =>
              list.setFilters({
                status: e.target.value as UserFilters["status"],
              })
            }
            className="md:w-40">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </Select>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Last login</TH>
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
                  <UserCog className="h-6 w-6 text-ink-400" />
                  <span>No users match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <Link
                      to={u.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {u.fullName || "—"}
                    </Link>
                  </TD>
                  <TD className="text-ink-600">{u.email}</TD>
                  <TD>
                    <Badge tone="brand">{ROLE_LABELS[u.role]}</Badge>
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[u.status] ?? "neutral"}>
                      {u.status}
                    </Badge>
                  </TD>
                  <TD className="text-ink-500 text-xs">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                  </TD>
                  <TD className="text-right">
                    <Link to={u.id}>
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
