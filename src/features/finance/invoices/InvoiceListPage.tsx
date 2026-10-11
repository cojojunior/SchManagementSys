import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, Plus } from "lucide-react";
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
import { invoicesService } from "@/services/invoices";
import type { Invoice, InvoiceFilters } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/format";

const PAGE_SIZE = 10;

const INITIAL_FILTERS: InvoiceFilters = {
  search: "",
  status: "all",
  termId: "all",
  academicYear: "all",
};

const STATUS_TONE: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info" | "brand"
> = {
  draft: "neutral",
  issued: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
  void: "neutral",
};

export default function InvoiceListPage() {
  const fetcher = useCallback(
    (f: InvoiceFilters, p: number, ps: number) =>
      invoicesService.list(f, p, ps),
    [],
  );

  const list = useList<Invoice, InvoiceFilters>({
    fetcher,
    initialFilters: INITIAL_FILTERS,
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Invoices"
        description={`${list.total} invoice${list.total === 1 ? "" : "s"}`}
        action={
          <RoleGate resource="invoices" action="create">
            <Link to="new">
              <Button>
                <Plus className="h-4 w-4" />
                New invoice
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
              placeholder="Search by invoice #, student, admission #…"
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>
          <Select
            value={list.filters.status}
            onChange={(e) =>
              list.setFilters({
                status: e.target.value as InvoiceFilters["status"],
              })
            }
            className="md:w-44">
            <option value="all">All statuses</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Partially paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </Select>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Invoice #</TH>
              <TH>Student</TH>
              <TH>Class</TH>
              <TH>Term</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Paid</TH>
              <TH className="text-right">Balance</TH>
              <TH>Status / Due</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {list.loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={9}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : list.data.length === 0 ? (
              <TableEmpty colSpan={9}>
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6 text-ink-400" />
                  <span>No invoices match your filters.</span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((inv) => {
                const overdue =
                  inv.status !== "paid" &&
                  inv.status !== "void" &&
                  new Date(inv.dueDate) < new Date();
                return (
                  <TR key={inv.id}>
                    <TD>
                      <div className="font-mono text-xs">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        Issued {formatDate(inv.issueDate)}
                      </div>
                    </TD>
                    <TD>
                      <Link
                        to={inv.id}
                        className="font-medium text-ink-900 hover:text-brand-600">
                        {inv.studentName}
                      </Link>
                      <div className="text-xs text-ink-500">
                        {inv.admissionNumber}
                      </div>
                    </TD>
                    <TD>{inv.className}</TD>
                    <TD>
                      {inv.termName}
                      <div className="text-xs text-ink-500">
                        {inv.academicYear}
                      </div>
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatCurrency(inv.total)}
                    </TD>
                    <TD className="text-right tabular-nums text-emerald-700">
                      {formatCurrency(inv.paid)}
                    </TD>
                    <TD className="text-right tabular-nums font-semibold">
                      {formatCurrency(inv.balance)}
                    </TD>
                    <TD>
                      <Badge
                        tone={
                          overdue
                            ? "danger"
                            : (STATUS_TONE[inv.status] ?? "neutral")
                        }>
                        {inv.status.replace("_", " ")}
                      </Badge>
                      <div
                        className={[
                          "text-xs mt-1",
                          overdue ? "text-red-600 font-medium" : "text-ink-500",
                        ].join(" ")}>
                        Due {formatDate(inv.dueDate)}
                      </div>
                    </TD>
                    <TD className="text-right">
                      <Link to={inv.id}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TD>
                  </TR>
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
