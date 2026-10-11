import { requireSupabase } from "@/lib/supabase";
import type { Remark } from "@/types/remark";

type DbRemark = {
  id: string;
  student_id: string;
  term_id: string;
  academic_year: string;
  teacher_remark: string | null;
  teacher_id: string | null;
  teacher_updated_at: string | null;
  headmaster_remark: string | null;
  headmaster_id: string | null;
  headmaster_updated_at: string | null;
  created_at: string;
  updated_at: string;
  teacher?: { first_name: string; last_name: string } | null;
  headmaster?: { full_name: string } | null;
};

const SELECT =
  "*, teacher:staff!remarks_teacher_id_fkey(first_name, last_name), headmaster:profiles!remarks_headmaster_id_fkey(full_name)";

function toDomain(row: DbRemark): Remark {
  return {
    id: row.id,
    studentId: row.student_id,
    termId: row.term_id,
    academicYear: row.academic_year,
    teacherRemark: row.teacher_remark ?? undefined,
    teacherId: row.teacher_id ?? undefined,
    teacherName: row.teacher
      ? `${row.teacher.first_name} ${row.teacher.last_name}`
      : undefined,
    teacherRemarkUpdatedAt: row.teacher_updated_at ?? undefined,
    headmasterRemark: row.headmaster_remark ?? undefined,
    headmasterName: row.headmaster?.full_name ?? undefined,
    headmasterRemarkUpdatedAt: row.headmaster_updated_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const remarksService = {
  async get(studentId: string, termId: string): Promise<Remark | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("remarks")
      .select(SELECT)
      .eq("student_id", studentId)
      .eq("term_id", termId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DbRemark) : null;
  },

  async listByTerm(termId: string): Promise<Remark[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("remarks")
      .select(SELECT)
      .eq("term_id", termId);
    if (error) throw new Error(error.message);
    return (data as unknown as DbRemark[]).map(toDomain);
  },

  async setTeacherRemark(
    studentId: string,
    termId: string,
    academicYear: string,
    remark: string,
    teacherId: string | undefined,
    _teacherName: string,
  ): Promise<Remark> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("remarks")
      .upsert(
        {
          student_id: studentId,
          term_id: termId,
          academic_year: academicYear,
          teacher_remark: remark,
          teacher_id: teacherId ?? null,
          teacher_updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,term_id" },
      )
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbRemark);
  },

  async setHeadmasterRemark(
    studentId: string,
    termId: string,
    academicYear: string,
    remark: string,
    _headmasterName: string,
  ): Promise<Remark> {
    const supabase = requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("remarks")
      .upsert(
        {
          student_id: studentId,
          term_id: termId,
          academic_year: academicYear,
          headmaster_remark: remark,
          headmaster_id: user?.id ?? null,
          headmaster_updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,term_id" },
      )
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbRemark);
  },

  async remove(studentId: string, termId: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("remarks")
      .delete()
      .eq("student_id", studentId)
      .eq("term_id", termId);
    if (error) throw new Error(error.message);
  },
};
