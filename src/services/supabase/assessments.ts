import { requireSupabase } from "@/lib/supabase";
import type {
  Assessment,
  AssessmentFilters,
  AssessmentFormValues,
} from "@/types/assessment";
import type { Paginated } from "@/types/common";

type DbAssessment = {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year: string;
  term_id: string;
  teacher_id: string | null;
  status: "draft" | "open" | "closed";
  max_assessment_score: number;
  max_exam_score: number;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  classes?: { name: string } | null;
  subjects?: { name: string; code: string } | null;
  terms?: { name: string } | null;
  staff?: { first_name: string; last_name: string } | null;
};

const SELECT =
  "*, classes(name), subjects(name, code), terms(name), staff(first_name, last_name)";

function toDomain(row: DbAssessment): Assessment {
  return {
    id: row.id,
    classId: row.class_id,
    className: row.classes?.name ?? "Unknown",
    subjectId: row.subject_id,
    subjectName: row.subjects?.name ?? "Unknown",
    subjectCode: row.subjects?.code ?? "—",
    academicYear: row.academic_year,
    termId: row.term_id,
    termName: row.terms?.name ?? "Unknown",
    teacherId: row.teacher_id ?? undefined,
    teacherName: row.staff
      ? `${row.staff.first_name} ${row.staff.last_name}`
      : undefined,
    status: row.status,
    maxAssessmentScore: row.max_assessment_score,
    maxExamScore: row.max_exam_score,
    dueDate: row.due_date ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const assessmentsService = {
  async list(
    filters: AssessmentFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Assessment>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("assessments")
      .select(SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.classId && filters.classId !== "all") {
      query = query.eq("class_id", filters.classId);
    }
    if (filters.subjectId && filters.subjectId !== "all") {
      query = query.eq("subject_id", filters.subjectId);
    }
    if (filters.termId && filters.termId !== "all") {
      query = query.eq("term_id", filters.termId);
    }
    if (filters.academicYear && filters.academicYear !== "all") {
      query = query.eq("academic_year", filters.academicYear);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbAssessment[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Assessment | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("assessments")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DbAssessment) : null;
  },

  async create(values: AssessmentFormValues): Promise<Assessment> {
    const supabase = requireSupabase();

    // Prevent duplicates
    const { data: existing } = await supabase
      .from("assessments")
      .select("id")
      .eq("class_id", values.classId)
      .eq("subject_id", values.subjectId)
      .eq("term_id", values.termId)
      .eq("academic_year", values.academicYear)
      .maybeSingle();

    if (existing) {
      throw new Error(
        "An assessment already exists for this class, subject, term, and academic year.",
      );
    }

    const { data, error } = await supabase
      .from("assessments")
      .insert({
        class_id: values.classId,
        subject_id: values.subjectId,
        academic_year: values.academicYear,
        term_id: values.termId,
        teacher_id: values.teacherId ?? null,
        status: values.status,
        max_assessment_score: values.maxAssessmentScore,
        max_exam_score: values.maxExamScore,
        due_date: values.dueDate ?? null,
        notes: values.notes ?? null,
      })
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbAssessment);
  },

  async update(id: string, values: AssessmentFormValues): Promise<Assessment> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("assessments")
      .update({
        class_id: values.classId,
        subject_id: values.subjectId,
        academic_year: values.academicYear,
        term_id: values.termId,
        teacher_id: values.teacherId ?? null,
        status: values.status,
        max_assessment_score: values.maxAssessmentScore,
        max_exam_score: values.maxExamScore,
        due_date: values.dueDate ?? null,
        notes: values.notes ?? null,
      })
      .eq("id", id)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbAssessment);
  },

  async remove(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
