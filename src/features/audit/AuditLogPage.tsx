import { useCallback, useEffect, useState } from "react";
import { Search, ScrollText, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
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
import { auditService } from "@/services/supabase/audit";
import type { AuditLogEntry, AuditLogFilters } from "@/types/audit";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

const INITIAL_FILTERS: AuditLogFilters = {
  search: "",
  action: "all",
  entity: "all",
};

export default function AuditLogPage() {
  const fetcher = useCallback(
    (f: AuditLogFilters, p: number, ps: number) => auditService.list(f, p, ps),
    [],
  );

  const list = useList<AuditLogEntry, AuditLogFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  const [facets, setFacets] = useState<{
    actions: string[];
    entities: string[];
  }>({
    actions: [],
    entities: [],
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    auditService.facets().then(setFacets);
  }, []);

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Audit Log"
        description={`${list.total} entr${list.total === 1 ? "y" : "ies"}`}
      />

      <Card>
        <div className="p-4 border-b border-ink-200 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search by action, entity, or actor…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.action}
            onChange={(e) =>
              list.setFilters({
                action: e.target.value as AuditLogFilters["action"],
              })
            }
            className="lg:w-44">
            <option value="all">All actions</option>
            {facets.actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Select
            value={list.filters.entity}
            onChange={(e) =>
              list.setFilters({
                entity: e.target.value as AuditLogFilters["entity"],
              })
            }
            className="lg:w-44">
            <option value="all">All entities</option>
            {facets.entities.map((en) => (
              <option key={en} value={en}>
                {en}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={list.filters.dateFrom ?? ""}
            onChange={(e) => list.setFilters({ dateFrom: e.target.value })}
            className="lg:w-40"
          />
          <Input
            type="date"
            value={list.filters.dateTo ?? ""}
            onChange={(e) => list.setFilters({ dateTo: e.target.value })}
            className="lg:w-40"
          />
        </div>

        <Table>
          <THead>
            <TR>
              <TH className="w-10"></TH>
              <TH>When</TH>
              <TH>Actor</TH>
              <TH>Action</TH>
              <TH>Entity</TH>
              <TH>Entity ID</TH>
              <TH>Reason</TH>
            </TR>
          </THead>
          <TBody>
            {list.loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={7}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : list.data.length === 0 ? (
              <TableEmpty colSpan={7}>
                <div className="flex flex-col items-center gap-2">
                  <ScrollText className="h-6 w-6 text-ink-400" />
                  <span>No audit entries match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((entry) => {
                const isOpen = expanded.has(entry.id);
                const hasDetails =
                  entry.beforeValue !== null && entry.beforeValue !== undefined
                    ? true
                    : entry.afterValue !== null &&
                        entry.afterValue !== undefined
                      ? true
                      : false;

                return (
                  <>
                    <TR
                      key={entry.id}
                      className={hasDetails ? "cursor-pointer" : undefined}
                      onClick={() => hasDetails && toggleRow(entry.id)}>
                      <TD>
                        {hasDetails ? (
                          isOpen ? (
                            <ChevronDown className="h-4 w-4 text-ink-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-ink-400" />
                          )
                        ) : null}
                      </TD>
                      <TD className="text-ink-500 text-xs whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </TD>
                      <TD className="text-sm">{entry.actorName}</TD>
                      <TD>
                        <Badge tone="brand">{entry.action}</Badge>
                      </TD>
                      <TD className="text-ink-600 text-sm">{entry.entity}</TD>
                      <TD className="font-mono text-xs text-ink-500">
                        {entry.entityId ? entry.entityId.slice(0, 8) : "—"}
                      </TD>
                      <TD className="text-ink-500 text-sm">
                        {entry.reason ?? "—"}
                      </TD>
                    </TR>
                    {isOpen && hasDetails && (
                      <TR key={`${entry.id}-detail`}>
                        <TD colSpan={7} className="bg-ink-50">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {entry.beforeValue !== null &&
                              entry.beforeValue !== undefined && (
                                <div>
                                  <div className="text-xs font-medium text-ink-600 mb-1">
                                    Before
                                  </div>
                                  <pre className="text-xs bg-white border border-ink-200 rounded p-3 overflow-x-auto">
                                    {JSON.stringify(entry.beforeValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                            {entry.afterValue !== null &&
                              entry.afterValue !== undefined && (
                                <div>
                                  <div className="text-xs font-medium text-ink-600 mb-1">
                                    After
                                  </div>
                                  <pre className="text-xs bg-white border border-ink-200 rounded p-3 overflow-x-auto">
                                    {JSON.stringify(entry.afterValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                          </div>
                        </TD>
                      </TR>
                    )}
                  </>
                );
              })
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
