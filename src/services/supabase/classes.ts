import { requireSupabase } from "@/lib/supabase";
import type { SchoolClass, ClassFilters } from "@/types/class";
import type { Paginated } from "@/types/common";

type DbClass = {
  id: string;
  name: string;
  division: "nursery" | "kg" | "primary" | "jhs";
  level: number;
  stream: string | null;
  class_teacher_id: string | null;
  capacity: number;
  academic_year: string;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
  staff?: { first_name: string; last_name: string } | null;
  students?: Array<{ count: number }>;
};

function toDomain(row: DbClass): SchoolClass {
  return {
    id: row.id,
    name: row.name,
    division: row.division,
    level: row.level,
    stream: row.stream ?? undefined,
    classTeacherId: row.class_teacher_id ?? undefined,
    classTeacherName: row.staff
      ? `${row.staff.first_name} ${row.staff.last_name}`
      : undefined,
    capacity: row.capacity,
    studentCount: row.students?.[0]?.count ?? 0,
    academicYear: row.academic_year,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const classesService = {
  async list(
    filters: ClassFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<SchoolClass>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("classes")
      .select("*, staff(first_name, last_name), students(count)", {
        count: "exact",
      })
      .order("division", { ascending: true })
      .order("level", { ascending: true });

    if (filters.search) {
      const q = `%${filters.search}%`;
      query = query.ilike("name", q);
    }
    if (filters.division && filters.division !== "all") {
      query = query.eq("division", filters.division);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.academicYear && filters.academicYear !== "all") {
      query = query.eq("academic_year", filters.academicYear);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbClass[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<SchoolClass | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("classes")
      .select("*, staff(first_name, last_name), students(count)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return toDomain(data as unknown as DbClass);
  },

  async create(values: {
    name: string;
    division: "nursery" | "kg" | "primary" | "jhs";
    level: number;
    stream?: string;
    classTeacherId?: string;
    capacity: number;
    academicYear: string;
    status: "active" | "inactive" | "archived";
  }): Promise<SchoolClass> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("classes")
      .insert({
        name: values.name,
        division: values.division,
        level: values.level,
        stream: values.stream ?? null,
        class_teacher_id: values.classTeacherId || null,
        capacity: values.capacity,
        academic_year: values.academicYear,
        status: values.status,
      })
      .select("*, staff(first_name, last_name)")
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbClass);
  },

  async update(
    id: string,
    values: Partial<{
      name: string;
      division: "nursery" | "kg" | "primary" | "jhs";
      level: number;
      stream: string;
      classTeacherId: string;
      capacity: number;
      academicYear: string;
      status: "active" | "inactive" | "archived";
    }>,
  ): Promise<SchoolClass> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("classes")
      .update({
        ...(values.name !== undefined && { name: values.name }),
        ...(values.division !== undefined && { division: values.division }),
        ...(values.level !== undefined && { level: values.level }),
        ...(values.stream !== undefined && { stream: values.stream }),
        ...(values.classTeacherId !== undefined && {
          class_teacher_id: values.classTeacherId || null,
        }),
        ...(values.capacity !== undefined && { capacity: values.capacity }),
        ...(values.academicYear !== undefined && {
          academic_year: values.academicYear,
        }),
        ...(values.status !== undefined && { status: values.status }),
      })
      .eq("id", id)
      .select("*, staff(first_name, last_name)")
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbClass);
  },

  async remove(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
