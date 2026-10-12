import { requireSupabase } from "@/lib/supabase";
import { pickOne } from "@/lib/pick-one";
import type {
  EnrollmentReport,
  FinanceReport,
  PerformanceReport,
  TeacherReport,
} from "@/types/reports";

type Joined<T> = T | T[] | null;

export const reportsService = {
  // ---------- Enrollment ----------
  async enrollment(): Promise<EnrollmentReport> {
    const supabase = requireSupabase();

    const [studentsRes, classesRes] = await Promise.all([
      supabase
        .from("students")
        .select("id, division, gender, class_id, status, classes(name)"),
      supabase.from("classes").select("id, name, division"),
    ]);

    const students = (studentsRes.data ?? []) as unknown as Array<{
      id: string;
      division: string;
      gender: string;
      class_id: string | null;
      status: string;
      classes: Joined<{ name: string }>;
    }>;

    const active = students.filter((s) => s.status === "active");

    const byDivisionMap = new Map<string, number>();
    const byClassMap = new Map<string, { name: string; count: number }>();
    for (const c of (classesRes.data ?? []) as Array<{
      id: string;
      name: string;
      division: string;
    }>) {
      byClassMap.set(c.id, { name: c.name, count: 0 });
    }
    const byGenderMap = new Map<string, number>();

    for (const s of active) {
      byDivisionMap.set(s.division, (byDivisionMap.get(s.division) ?? 0) + 1);
      byGenderMap.set(s.gender, (byGenderMap.get(s.gender) ?? 0) + 1);

      if (s.class_id) {
        const cls = pickOne(s.classes);
        const prev = byClassMap.get(s.class_id);
        byClassMap.set(s.class_id, {
          name: prev?.name ?? cls?.name ?? "—",
          count: (prev?.count ?? 0) + 1,
        });
      }
    }

    return {
      totalStudents: students.length,
      activeStudents: active.length,
      byDivision: Array.from(byDivisionMap.entries()).map(
        ([division, count]) => ({
          division,
          count,
        }),
      ),
      byClass: Array.from(byClassMap.entries()).map(([classId, v]) => ({
        classId,
        className: v.name,
        count: v.count,
      })),
      byGender: Array.from(byGenderMap.entries()).map(([gender, count]) => ({
        gender,
        count,
      })),
    };
  },

  // ---------- Performance ----------
  async performance(termId: string): Promise<PerformanceReport | null> {
    const supabase = requireSupabase();

    const { data: term } = await supabase
      .from("terms")
      .select("id, name, academic_year_id")
      .eq("id", termId)
      .maybeSingle();
    if (!term) return null;

    const { data: year } = await supabase
      .from("academic_years")
      .select("name")
      .eq("id", term.academic_year_id)
      .maybeSingle();

    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, subject_id, subjects(name)")
      .eq("term_id", termId);

    const assessmentIds = ((assessments ?? []) as Array<{ id: string }>).map(
      (a) => a.id,
    );
    if (assessmentIds.length === 0) {
      return {
        termId,
        termName: term.name,
        academicYear: year?.name ?? "—",
        bySubject: [],
        gradeDistribution: [],
        overallAverage: 0,
      };
    }

    const { data: scores } = await supabase
      .from("scores")
      .select("assessment_id, final_score, grade")
      .in("assessment_id", assessmentIds)
      .not("final_score", "is", null);

    const subjectsById = new Map<string, string>();
    for (const a of (assessments ?? []) as unknown as Array<{
      id: string;
      subject_id: string;
      subjects: Joined<{ name: string }>;
    }>) {
      const s = pickOne(a.subjects);
      subjectsById.set(a.id, s?.name ?? "—");
    }

    const subjectBuckets = new Map<
      string,
      { name: string; scores: number[] }
    >();
    const gradeBuckets = new Map<string, number>();
    const allScores: number[] = [];

    for (const sc of (scores ?? []) as unknown as Array<{
      assessment_id: string;
      final_score: number | null;
      grade: string | null;
    }>) {
      const f = Number(sc.final_score ?? 0);
      const subjName = subjectsById.get(sc.assessment_id) ?? "—";
      const bucket = subjectBuckets.get(subjName) ?? {
        name: subjName,
        scores: [],
      };
      bucket.scores.push(f);
      subjectBuckets.set(subjName, bucket);
      allScores.push(f);
      if (sc.grade) {
        gradeBuckets.set(sc.grade, (gradeBuckets.get(sc.grade) ?? 0) + 1);
      }
    }

    const bySubject = Array.from(subjectBuckets.entries())
      .map(([, v]) => {
        const sum = v.scores.reduce((a, b) => a + b, 0);
        return {
          subjectId: v.name,
          subjectName: v.name,
          average: Math.round((sum / v.scores.length) * 10) / 10,
          highest: Math.max(...v.scores),
          lowest: Math.min(...v.scores),
          count: v.scores.length,
        };
      })
      .sort((a, b) => b.average - a.average);

    const overallAverage =
      allScores.length === 0
        ? 0
        : Math.round(
            (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10,
          ) / 10;

    return {
      termId,
      termName: term.name,
      academicYear: year?.name ?? "—",
      bySubject,
      gradeDistribution: Array.from(gradeBuckets.entries())
        .map(([grade, count]) => ({ grade, count }))
        .sort((a, b) => a.grade.localeCompare(b.grade)),
      overallAverage,
    };
  },

  // ---------- Finance ----------
  async finance(): Promise<FinanceReport> {
    const supabase = requireSupabase();

    const [invoicesRes, paymentsRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, total, paid, balance, students(division)"),
      supabase.from("payments").select("amount, method"),
    ]);

    const invoices = (invoicesRes.data ?? []) as unknown as Array<{
      id: string;
      total: number;
      paid: number;
      balance: number;
      students: Joined<{ division: string }>;
    }>;

    const totalBilled = invoices.reduce((s, i) => s + Number(i.total), 0);
    const totalCollected = invoices.reduce((s, i) => s + Number(i.paid), 0);
    const totalOutstanding = invoices.reduce(
      (s, i) => s + Number(i.balance),
      0,
    );

    // Payments by method
    const methodMap = new Map<string, { amount: number; count: number }>();
    for (const p of (paymentsRes.data ?? []) as unknown as Array<{
      amount: number;
      method: string;
    }>) {
      const cur = methodMap.get(p.method) ?? { amount: 0, count: 0 };
      cur.amount += Number(p.amount);
      cur.count += 1;
      methodMap.set(p.method, cur);
    }

    // Invoices by division
    const divisionMap = new Map<
      string,
      { billed: number; collected: number; outstanding: number }
    >();
    for (const i of invoices) {
      const st = pickOne(i.students);
      const div = st?.division ?? "unknown";
      const cur = divisionMap.get(div) ?? {
        billed: 0,
        collected: 0,
        outstanding: 0,
      };
      cur.billed += Number(i.total);
      cur.collected += Number(i.paid);
      cur.outstanding += Number(i.balance);
      divisionMap.set(div, cur);
    }

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate:
        totalBilled === 0
          ? 0
          : Math.round((totalCollected / totalBilled) * 100),
      byMethod: Array.from(methodMap.entries())
        .map(([method, v]) => ({ method, ...v }))
        .sort((a, b) => b.amount - a.amount),
      byDivision: Array.from(divisionMap.entries()).map(([division, v]) => ({
        division,
        ...v,
      })),
    };
  },

  // ---------- Teacher's own classes ----------
  async teacherOwn(teacherStaffId: string): Promise<TeacherReport[]> {
    const supabase = requireSupabase();

    const { data: assignments } = await supabase
      .from("teaching_assignments")
      .select("class_id, subject_id, classes(name), subjects(name)")
      .eq("staff_id", teacherStaffId)
      .eq("is_active", true);

    const rows: TeacherReport[] = [];

    for (const a of (assignments ?? []) as unknown as Array<{
      class_id: string;
      subject_id: string;
      classes: Joined<{ name: string }>;
      subjects: Joined<{ name: string }>;
    }>) {
      const cls = pickOne(a.classes);
      const subj = pickOne(a.subjects);

      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("class_id", a.class_id)
        .eq("status", "active");

      const { data: assessments } = await supabase
        .from("assessments")
        .select("id")
        .eq("class_id", a.class_id)
        .eq("subject_id", a.subject_id);

      const ids = ((assessments ?? []) as Array<{ id: string }>).map(
        (x) => x.id,
      );

      let marksEntered = 0;
      let classAverage = 0;
      let highest = 0;
      let lowest = 0;

      if (ids.length > 0) {
        const { data: scores } = await supabase
          .from("scores")
          .select("final_score")
          .in("assessment_id", ids)
          .not("final_score", "is", null);

        const values = ((scores ?? []) as Array<{ final_score: number }>).map(
          (s) => Number(s.final_score),
        );
        marksEntered = values.length;
        if (values.length > 0) {
          const sum = values.reduce((x, y) => x + y, 0);
          classAverage = Math.round((sum / values.length) * 10) / 10;
          highest = Math.max(...values);
          lowest = Math.min(...values);
        }
      }

      rows.push({
        className: cls?.name ?? "—",
        subjectName: subj?.name ?? "—",
        studentCount: studentCount ?? 0,
        marksEntered,
        classAverage,
        highest,
        lowest,
      });
    }

    return rows;
  },
};
