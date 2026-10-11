import { requireSupabase } from "@/lib/supabase";
import type {
  AssessmentResult,
  ResultChangeLog,
  ResultFilters,
  ResultStatus,
} from "@/types/result";
import type { Paginated } from "@/types/common";

type DbPublication = {
  assessment_id: string;
  status: ResultStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  locked_at: string | null;
  assessments: {
    id: string;
    class_id: string;
    subject_id: string;
    academic_year: string;
    term_id: string;
    teacher_id: string | null;
    classes: { name: string } | null;
    subjects: { name: string; code: string } | null;
    terms: { name: string } | null;
    staff: { first_name: string; last_name: string } | null;
  };
};

const SELECT = `
  assessment_id, status, submitted_at, reviewed_at, published_at, locked_at,
  assessments(
    id, class_id, subject_id, academic_year, term_id, teacher_id,
    classes(name),
    subjects(name, code),
    terms(name),
    staff(first_name, last_name)
  )
`;

export const resultsService = {
  async list(
    filters: ResultFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<AssessmentResult>> {
    const supabase = requireSupabase();

    let query = supabase
      .from("result_publications")
      .select(SELECT, { count: "exact" })
      .order("updated_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const rows = data as unknown as DbPublication[];

    // Fetch student counts and averages per assessment in one batch
    const assessmentIds = rows.map((r) => r.assessment_id);
    const stats = await fetchAssessmentStats(assessmentIds);

    const result: AssessmentResult[] = rows
      .filter((row) => {
        // Filter client-side for things not directly on the publication row
        if (
          filters.classId &&
          filters.classId !== "all" &&
          row.assessments.class_id !== filters.classId
        )
          return false;
        if (
          filters.subjectId &&
          filters.subjectId !== "all" &&
          row.assessments.subject_id !== filters.subjectId
        )
          return false;
        if (
          filters.termId &&
          filters.termId !== "all" &&
          row.assessments.term_id !== filters.termId
        )
          return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const hay = [
            row.assessments.classes?.name,
            row.assessments.subjects?.name,
            row.assessments.terms?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((row) => {
        const s = stats.get(row.assessment_id);
        return {
          assessmentId: row.assessment_id,
          classId: row.assessments.class_id,
          className: row.assessments.classes?.name ?? "—",
          subjectId: row.assessments.subject_id,
          subjectName: row.assessments.subjects?.name ?? "—",
          subjectCode: row.assessments.subjects?.code ?? "—",
          academicYear: row.assessments.academic_year,
          termId: row.assessments.term_id,
          termName: row.assessments.terms?.name ?? "—",
          teacherId: row.assessments.teacher_id ?? undefined,
          teacherName: row.assessments.staff
            ? `${row.assessments.staff.first_name} ${row.assessments.staff.last_name}`
            : undefined,
          status: row.status,
          studentCount: s?.count ?? 0,
          classAverage: s?.average ?? 0,
          highest: s?.highest ?? 0,
          lowest: s?.lowest ?? 0,
          submittedAt: row.submitted_at ?? undefined,
          reviewedAt: row.reviewed_at ?? undefined,
          publishedAt: row.published_at ?? undefined,
          lockedAt: row.locked_at ?? undefined,
        };
      });

    return {
      data: result,
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(assessmentId: string): Promise<AssessmentResult | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("result_publications")
      .select(SELECT)
      .eq("assessment_id", assessmentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const row = data as unknown as DbPublication;
    const stats = await fetchAssessmentStats([assessmentId]);
    const s = stats.get(assessmentId);

    return {
      assessmentId: row.assessment_id,
      classId: row.assessments.class_id,
      className: row.assessments.classes?.name ?? "—",
      subjectId: row.assessments.subject_id,
      subjectName: row.assessments.subjects?.name ?? "—",
      subjectCode: row.assessments.subjects?.code ?? "—",
      academicYear: row.assessments.academic_year,
      termId: row.assessments.term_id,
      termName: row.assessments.terms?.name ?? "—",
      teacherId: row.assessments.teacher_id ?? undefined,
      teacherName: row.assessments.staff
        ? `${row.assessments.staff.first_name} ${row.assessments.staff.last_name}`
        : undefined,
      status: row.status,
      studentCount: s?.count ?? 0,
      classAverage: s?.average ?? 0,
      highest: s?.highest ?? 0,
      lowest: s?.lowest ?? 0,
      submittedAt: row.submitted_at ?? undefined,
      reviewedAt: row.reviewed_at ?? undefined,
      publishedAt: row.published_at ?? undefined,
      lockedAt: row.locked_at ?? undefined,
    };
  },

  async changeLog(assessmentId: string): Promise<ResultChangeLog[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("result_change_log")
      .select("*, profiles!actor_id(full_name)")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (
      data as unknown as Array<{
        id: string;
        assessment_id: string;
        actor_id: string | null;
        action: ResultChangeLog["action"];
        reason: string | null;
        before_value: string | null;
        after_value: string | null;
        created_at: string;
        profiles?: { full_name: string } | null;
      }>
    ).map((r) => ({
      id: r.id,
      assessmentId: r.assessment_id,
      actorName: r.profiles?.full_name ?? "System",
      action: r.action,
      reason: r.reason ?? undefined,
      before: r.before_value ?? undefined,
      after: r.after_value ?? undefined,
      createdAt: r.created_at,
    }));
  },

  // ---------- Transitions ----------

  async submitForReview(assessmentId: string): Promise<void> {
    await transition(assessmentId, "submitted", "submitted");
  },
  async returnForCorrection(
    assessmentId: string,
    reason: string,
  ): Promise<void> {
    await transition(assessmentId, "draft", "returned", reason);
  },
  async approve(assessmentId: string): Promise<void> {
    await transition(assessmentId, "approved", "approved");
  },
  async publish(assessmentId: string): Promise<void> {
    await transition(assessmentId, "published", "published");
  },
  async lock(assessmentId: string): Promise<void> {
    await transition(assessmentId, "locked", "locked");
  },
};

async function transition(
  assessmentId: string,
  newStatus: ResultStatus,
  logAction: ResultChangeLog["action"],
  reason?: string,
) {
  const supabase = requireSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: newStatus, updated_at: now };
  if (newStatus === "submitted") patch.submitted_at = now;
  if (newStatus === "approved") patch.reviewed_at = now;
  if (newStatus === "published") patch.published_at = now;
  if (newStatus === "locked") patch.locked_at = now;

  const { error: pubError } = await supabase.from("result_publications").upsert(
    { assessment_id: assessmentId, ...patch },
    {
      onConflict: "assessment_id",
    },
  );
  if (pubError) throw new Error(pubError.message);

  // Update the scores too
  const scoresPatch =
    newStatus === "draft"
      ? "draft"
      : newStatus === "submitted"
        ? "submitted"
        : newStatus === "approved"
          ? "approved"
          : newStatus === "published"
            ? "published"
            : "published";
  await supabase
    .from("scores")
    .update({ status: scoresPatch })
    .eq("assessment_id", assessmentId);

  // Log
  await supabase.from("result_change_log").insert({
    assessment_id: assessmentId,
    actor_id: user?.id ?? null,
    action: logAction,
    reason: reason ?? null,
  });
}

async function fetchAssessmentStats(assessmentIds: string[]) {
  const map = new Map<
    string,
    { count: number; average: number; highest: number; lowest: number }
  >();
  if (assessmentIds.length === 0) return map;

  const supabase = requireSupabase();
  const { data } = await supabase
    .from("scores")
    .select("assessment_id, final_score")
    .in("assessment_id", assessmentIds)
    .not("final_score", "is", null);

  const buckets = new Map<string, number[]>();
  for (const row of data as unknown as Array<{
    assessment_id: string;
    final_score: number;
  }>) {
    const arr = buckets.get(row.assessment_id) ?? [];
    arr.push(Number(row.final_score));
    buckets.set(row.assessment_id, arr);
  }

  for (const [id, arr] of buckets) {
    if (arr.length === 0) continue;
    const sum = arr.reduce((a, b) => a + b, 0);
    map.set(id, {
      count: arr.length,
      average: Math.round((sum / arr.length) * 10) / 10,
      highest: Math.max(...arr),
      lowest: Math.min(...arr),
    });
  }
  return map;
}
