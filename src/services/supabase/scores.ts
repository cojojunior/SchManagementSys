import { requireSupabase } from "@/lib/supabase";
import type {
  Score,
  MarkEntryRow,
  SaveScoresPayload,
  ScoreStatus,
} from "@/types/score";

type DbScore = {
  id: string;
  assessment_id: string;
  student_id: string;
  assessment_raw: number | null;
  exam_raw: number | null;
  assessment_weighted: number | null;
  exam_weighted: number | null;
  final_score: number | null;
  grade: string | null;
  grade_label: string | null;
  remark: string | null;
  status: ScoreStatus;
  updated_at: string;
  students?: {
    first_name: string;
    last_name: string;
    admission_number: string;
  } | null;
};

const SELECT = "*, students(first_name, last_name, admission_number)";

function toDomain(row: DbScore): Score {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    studentId: row.student_id,
    studentName: row.students
      ? `${row.students.first_name} ${row.students.last_name}`
      : "Unknown",
    admissionNumber: row.students?.admission_number ?? "—",
    assessmentRaw: row.assessment_raw,
    examRaw: row.exam_raw,
    assessmentWeighted: Number(row.assessment_weighted ?? 0),
    examWeighted: Number(row.exam_weighted ?? 0),
    finalScore: Number(row.final_score ?? 0),
    grade: row.grade ?? "—",
    gradeLabel: row.grade_label ?? "—",
    remark: row.remark ?? undefined,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export const scoresService = {
  async listByAssessment(assessmentId: string): Promise<Score[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("scores")
      .select(SELECT)
      .eq("assessment_id", assessmentId);
    if (error) throw new Error(error.message);
    return (data as unknown as DbScore[]).map(toDomain);
  },

  async listByAssessmentIds(assessmentIds: string[]): Promise<Score[]> {
    if (assessmentIds.length === 0) return [];
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("scores")
      .select(SELECT)
      .in("assessment_id", assessmentIds);
    if (error) throw new Error(error.message);
    return (data as unknown as DbScore[]).map(toDomain);
  },

  async get(id: string): Promise<Score | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("scores")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DbScore) : null;
  },

  async saveScores(payload: SaveScoresPayload): Promise<Score[]> {
    const supabase = requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Upsert: rely on the unique(assessment_id, student_id) constraint
    const rows = payload.rows.map((r: MarkEntryRow) => ({
      assessment_id: payload.assessmentId,
      student_id: r.studentId,
      assessment_raw: r.assessmentRaw,
      exam_raw: r.examRaw,
      remark: r.remark ?? null,
      status: "draft" as ScoreStatus,
      updated_by: user?.id ?? null,
    }));

    const { data, error } = await supabase
      .from("scores")
      .upsert(rows, {
        onConflict: "assessment_id,student_id",
        ignoreDuplicates: false,
      })
      .select(SELECT);

    if (error) throw new Error(error.message);

    // The DB trigger `scores_recalc` computes weighted + grade + final_score.
    // Re-read to get the computed values.
    const ids = (data as unknown as DbScore[]).map((d) => d.id);
    if (ids.length === 0) return [];

    const { data: refreshed, error: refError } = await supabase
      .from("scores")
      .select(SELECT)
      .in("id", ids);

    if (refError) throw new Error(refError.message);
    return (refreshed as unknown as DbScore[]).map(toDomain);
  },

  async updateStatus(assessmentId: string, status: ScoreStatus): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("scores")
      .update({ status })
      .eq("assessment_id", assessmentId);
    if (error) throw new Error(error.message);
  },

  async updateScore(
    scoreId: string,
    patch: Partial<
      Pick<Score, "assessmentRaw" | "examRaw" | "remark" | "grade">
    >,
  ): Promise<Score | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("scores")
      .update({
        ...(patch.assessmentRaw !== undefined && {
          assessment_raw: patch.assessmentRaw,
        }),
        ...(patch.examRaw !== undefined && { exam_raw: patch.examRaw }),
        ...(patch.remark !== undefined && { remark: patch.remark }),
      })
      .eq("id", scoreId)
      .select(SELECT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DbScore) : null;
  },
};
