import { requireSupabase } from "@/lib/supabase";
import type {
  TeachingAssignment,
  TeachingAssignmentFilters,
  TeachingAssignmentFormValues,
} from "@/types/teaching-assignment";
import type { Paginated } from "@/types/common";

type DbAssignment = {
  id: string;
  staff_id: string;
  class_id: string;
  subject_id: string;
  academic_year: string;
  term_id: string | null;
  periods_per_week: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  staff?: { first_name: string; last_name: string } | null;
  classes?: { name: string } | null;
  subjects?: { name: string; code: string } | null;
  terms?: { name: string } | null;
};

function toDomain(row: DbAssignment): TeachingAssignment {
  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: row.staff
      ? `${row.staff.first_name} ${row.staff.last_name}`
      : "Unknown",
    classId: row.class_id,
    className: row.classes?.name ?? "Unknown",
    subjectId: row.subject_id,
    subjectName: row.subjects?.name ?? "Unknown",
    subjectCode: row.subjects?.code ?? "—",
    academicYear: row.academic_year,
    termId: row.term_id ?? undefined,
    termName: row.terms?.name,
    periodsPerWeek: row.periods_per_week ?? undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT =
  "*, staff(first_name, last_name), classes(name), subjects(name, code), terms(name)";

export const teachingAssignmentsService = {
  async list(
    filters: TeachingAssignmentFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<TeachingAssignment>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("teaching_assignments")
      .select(SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.staffId && filters.staffId !== "all") {
      query = query.eq("staff_id", filters.staffId);
    }
    if (filters.classId && filters.classId !== "all") {
      query = query.eq("class_id", filters.classId);
    }
    if (filters.subjectId && filters.subjectId !== "all") {
      query = query.eq("subject_id", filters.subjectId);
    }
    if (filters.academicYear && filters.academicYear !== "all") {
      query = query.eq("academic_year", filters.academicYear);
    }
    if (filters.isActive === "true") query = query.eq("is_active", true);
    if (filters.isActive === "false") query = query.eq("is_active", false);

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbAssignment[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<TeachingAssignment | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("teaching_assignments")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DbAssignment) : null;
  },

  async create(
    values: TeachingAssignmentFormValues,
  ): Promise<TeachingAssignment> {
    const supabase = requireSupabase();

    const { data: existing } = await supabase
      .from("teaching_assignments")
      .select("id")
      .eq("staff_id", values.staffId)
      .eq("class_id", values.classId)
      .eq("subject_id", values.subjectId)
      .eq("academic_year", values.academicYear)
      .maybeSingle();

    if (existing) {
      throw new Error(
        "This staff member is already assigned to teach this subject in this class for the given academic year.",
      );
    }

    const { data, error } = await supabase
      .from("teaching_assignments")
      .insert({
        staff_id: values.staffId,
        class_id: values.classId,
        subject_id: values.subjectId,
        academic_year: values.academicYear,
        term_id: values.termId ?? null,
        periods_per_week: values.periodsPerWeek ?? null,
        notes: values.notes ?? null,
        is_active: values.isActive,
      })
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbAssignment);
  },

  async update(
    id: string,
    values: TeachingAssignmentFormValues,
  ): Promise<TeachingAssignment> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("teaching_assignments")
      .update({
        staff_id: values.staffId,
        class_id: values.classId,
        subject_id: values.subjectId,
        academic_year: values.academicYear,
        term_id: values.termId ?? null,
        periods_per_week: values.periodsPerWeek ?? null,
        notes: values.notes ?? null,
        is_active: values.isActive,
      })
      .eq("id", id)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbAssignment);
  },

  async remove(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("teaching_assignments")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
