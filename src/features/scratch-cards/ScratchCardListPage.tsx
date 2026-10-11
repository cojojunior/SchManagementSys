import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Ticket } from "lucide-react";
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
import { scratchCardsService } from "@/services/scratch-cards";
import type { ScratchCard, ScratchCardFilters } from "@/types/scratch-card";
import { formatCurrency, formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

const INITIAL_FILTERS: ScratchCardFilters = {
  search: "",
  division: "all",
  status: "all",
  termId: "all",
};

const STATUS_TONE: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info" | "brand"
> = {
  unused: "success",
  partially_used: "info",
  exhausted: "neutral",
  invalidated: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  unused: "Unused",
  partially_used: "Partially used",
  exhausted: "Exhausted",
  invalidated: "Invalidated",
};

export default function ScratchCardListPage() {
  const fetcher = useCallback(
    (f: ScratchCardFilters, p: number, ps: number) =>
      scratchCardsService.list(f, p, ps),
    [],
  );

  const list = useList<ScratchCard, ScratchCardFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Scratch Cards"
        description={`${list.total} card${list.total === 1 ? "" : "s"}`}
        action={
          <RoleGate resource="scratch_cards" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                Generate cards
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
              placeholder="Search by serial, student, or term…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.division}
            onChange={(e) =>
              list.setFilters({
                division: e.target.value as ScratchCardFilters["division"],
              })
            }
            className="lg:w-40">
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
                status: e.target.value as ScratchCardFilters["status"],
              })
            }
            className="lg:w-44">
            <option value="all">All statuses</option>
            <option value="unused">Unused</option>
            <option value="partially_used">Partially used</option>
            <option value="exhausted">Exhausted</option>
            <option value="invalidated">Invalidated</option>
          </Select>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Serial</TH>
              <TH>Division</TH>
              <TH>Term</TH>
              <TH>PIN</TH>
              <TH>Issued to</TH>
              <TH className="text-right">Price</TH>
              <TH className="text-center">Uses left</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={9}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : list.data.length === 0 ? (
              <TableEmpty colSpan={9}>
                <div className="flex flex-col items-center gap-2">
                  <Ticket className="h-6 w-6 text-ink-400" />
                  <span>No scratch cards match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((c) => (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">
                    <Link
                      to={c.id}
                      className="text-ink-900 hover:text-brand-600">
                      {c.serialNumber}
                    </Link>
                  </TD>
                  <TD className="uppercase">{c.division}</TD>
                  <TD>
                    {c.termName}
                    <div className="text-xs text-ink-500">{c.academicYear}</div>
                  </TD>
                  <TD className="font-mono text-ink-400">{c.maskedPin}</TD>
                  <TD>
                    {c.issuedToStudentName ?? (
                      <span className="text-ink-400">Unassigned</span>
                    )}
                    {c.issuedAt && (
                      <div className="text-xs text-ink-500">
                        {formatDate(c.issuedAt)}
                      </div>
                    )}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {formatCurrency(c.price)}
                  </TD>
                  <TD className="text-center tabular-nums font-semibold">
                    {c.usesRemaining} / 3
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>
                      {STATUS_LABEL[c.status] ?? c.status}
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
