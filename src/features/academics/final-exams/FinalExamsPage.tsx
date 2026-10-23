import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileSpreadsheet } from "lucide-react";
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
import { useList } from "@/hooks/useList";
import { useAuth } from "@/features/auth/AuthContext";
import { assessmentsService } from "@/services/supabase/assessments";
import { teachingAssignmentsService } from "@/services/supabase/teaching-assignments";
import type { Assessment, AssessmentFilters } from "@/types/assessment";

const PAGE_SIZE = 10;

const STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "info"> =
  {
    draft: "neutral",
    open: "info",
    closed: "success",
  };

export default function AssessmentListPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

  // 1. Load the teacher's specific assignments to build the dropdowns
  useEffect(() => {
    if (!user?.id || !isTeacher) return;

    teachingAssignmentsService
      .list({ teacherId: user.id }, 1, 200)
      .then((res) => {
        // Extract unique classes
        const uniqueClasses = Array.from(
          new Map(
            res.data.map((a) => [
              a.classId,
              { id: a.classId, name: a.className },
            ]),
          ).values(),
        );
        // Extract unique subjects
        const uniqueSubjects = Array.from(
          new Map(
            res.data.map((a) => [
              a.subjectId,
              { id: a.subjectId, name: a.subjectName },
            ]),
          ).values(),
        );

        setClasses(uniqueClasses);
        setSubjects(uniqueSubjects);
      });
  }, [user?.id, isTeacher]);

  const fetcher = useCallback(
    (f: AssessmentFilters, p: number, ps: number) => {
      // 2. If teacher, force the filter to only their ID
      const finalFilters = isTeacher ? { ...f, teacherId: user?.id } : f;
      return assessmentsService.list(finalFilters, p, ps);
    },
    [isTeacher, user?.id],
  );

  const list = useList<Assessment, AssessmentFilters>({
    fetcher,
    initialFilters: {
      search: "",
      classId: "all",
      subjectId: "all",
      termId: "all",
      academicYear: "all",
      status: "all",
    },
    pageSize: PAGE_SIZE,
  });

  return (
    <>
      <PageHeader
        title="Assessments"
        description={`${list.total} assessment${list.total === 1 ? "" : "s"}`}
      />

      <Card>
        <div className="p-4 border-b border-ink-200 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search by class, subject, term..."
              className="pl-9"
              value={list.filters.search ?? ""}
              onChange={(e) => list.setFilters({ search: e.target.value })}
            />
          </div>

          {/* Only show Class dropdown if teacher teaches more than 1 class */}
          {(!isTeacher || classes.length > 1) && (
            <Select
              value={list.filters.classId}
              onChange={(e) =>
                list.setFilters({ classId: e.target.value as any })
              }
              className="lg:w-40">
              <option value="all">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}

          {/* Only show Subject dropdown if teacher teaches more than 1 subject */}
          {(!isTeacher || subjects.length > 1) && (
            <Select
              value={list.filters.subjectId}
              onChange={(e) =>
                list.setFilters({ subjectId: e.target.value as any })
              }
              className="lg:w-44">
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Class</TH>
              <TH>Subject</TH>
              <TH>Term</TH>
              <TH>Score split</TH>
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
                  <FileSpreadsheet className="h-6 w-6 text-ink-400" />
                  <span>
                    No assessments assigned to you match your filters.
                  </span>
                </div>
              </TableEmpty>
            ) : (
              list.data.map((a) => (
                <TR key={a.id}>
                  <TD>
                    <Link
                      to={a.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {a.className}
                    </Link>
                  </TD>
                  <TD>
                    <span className="font-mono text-xs text-ink-500 mr-2">
                      {a.subjectCode}
                    </span>
                    {a.subjectName}
                  </TD>
                  <TD>
                    {a.termName}
                    <div className="text-xs text-ink-500">{a.academicYear}</div>
                  </TD>
                  <TD className="tabular-nums text-ink-500">
                    {a.maxAssessmentScore} / {a.maxExamScore}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>
                      {a.status}
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
