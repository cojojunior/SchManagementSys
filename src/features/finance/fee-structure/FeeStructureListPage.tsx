import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Receipt } from "lucide-react";
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
import { feeStructuresService } from "@/services/fee-structure";
import type { FeeStructure, FeeStructureFilters } from "@/types/finance";
import { formatCurrency } from "@/lib/format";

const PAGE_SIZE = 10;

const INITIAL_FILTERS: FeeStructureFilters = {
  search: "",
  division: "all",
  termId: "all",
  status: "all",
};

export default function FeeStructureListPage() {
  const fetcher = useCallback(
    (f: FeeStructureFilters, p: number, ps: number) =>
      feeStructuresService.list(f, p, ps),
    [],
  );

  const list = useList<FeeStructure, FeeStructureFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Fee Structures"
        description={`${list.total} structure${list.total === 1 ? "" : "s"}`}
        action={
          <RoleGate resource="fees" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Add fee structure
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
              placeholder="Search by name or term…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.division}
            onChange={(e) =>
              list.setFilters({
                division: e.target.value as FeeStructureFilters["division"],
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
                status: e.target.value as FeeStructureFilters["status"],
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
              <TH>Name</TH>
              <TH>Division</TH>
              <TH>Term</TH>
              <TH>Items</TH>
              <TH className="text-right">Total</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={7}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : list.data.length === 0 ? (
              <TableEmpty colSpan={7}>
                <div className="flex flex-col items-center gap-2">
                  <Receipt className="h-6 w-6 text-ink-400" />
                  <span>No fee structures match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <Link
                      to={s.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {s.name}
                    </Link>
                    {s.className && (
                      <div className="text-xs text-ink-500">{s.className}</div>
                    )}
                  </TD>
                  <TD className="uppercase">{s.division}</TD>
                  <TD>
                    {s.termName}
                    <div className="text-xs text-ink-500">{s.academicYear}</div>
                  </TD>
                  <TD className="tabular-nums">{s.items.length}</TD>
                  <TD className="text-right tabular-nums font-semibold">
                    {formatCurrency(s.total)}
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
