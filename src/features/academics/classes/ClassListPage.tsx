import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, School } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TableEmpty,
} from "@/components/ui/Table";
import { useAuth } from "@/features/auth/AuthContext";
import { classesService } from "@/services/supabase/classes";
import { teachingAssignmentsService } from "@/services/supabase/teaching-assignments";
import type { SchoolClass } from "@/types/class";

export default function ClassListPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (isTeacher && user?.id) {
          // 1. Fetch teacher's assignments
          const assignmentsRes = await teachingAssignmentsService.list(
            { teacherId: user.id },
            1,
            200,
          );

          // 2. Extract unique class IDs
          const uniqueClassIds = Array.from(
            new Set(assignmentsRes.data.map((a) => a.classId)),
          );

          if (uniqueClassIds.length === 0) {
            if (!cancelled) setClasses([]);
            return;
          }

          // 3. Fetch all classes and filter down to the teacher's classes
          const allClassesRes = await classesService.list({}, 1, 200);
          const teacherClasses = allClassesRes.data.filter((c) =>
            uniqueClassIds.includes(c.id),
          );

          if (!cancelled) setClasses(teacherClasses);
        } else {
          // Admin/Headmaster/Secretary sees all classes
          const res = await classesService.list({}, 1, 200);
          if (!cancelled) setClasses(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isTeacher, user?.id]);

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title={isTeacher ? "My Classes" : "Classes"}
        description={
          isTeacher
            ? "Classes you are assigned to teach"
            : "Manage school classes and streams"
        }
      />

      <Card>
        <div className="p-4 border-b border-ink-200">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search classes..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Class Name</TH>
              <TH>Division</TH>
              <TH>Capacity</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={4}>
                    <div className="h-4 bg-ink-100 rounded animate-pulse" />
                  </TD>
                </TR>
              ))
            ) : filtered.length === 0 ? (
              <TableEmpty colSpan={4}>
                <div className="flex flex-col items-center gap-2">
                  <School className="h-6 w-6 text-ink-400" />
                  <span>
                    {isTeacher
                      ? "You have not been assigned to any classes yet."
                      : "No classes match your search."}
                  </span>
                </div>
              </TableEmpty>
            ) : (
              filtered.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link
                      to={c.id}
                      className="font-medium text-ink-900 hover:text-brand-600">
                      {c.name}
                    </Link>
                  </TD>
                  <TD className="capitalize text-ink-600">{c.division}</TD>
                  <TD className="tabular-nums text-ink-600">
                    {c.capacity ?? "—"}
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
      </Card>
    </>
  );
}
