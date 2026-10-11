import { requireSupabase } from "@/lib/supabase";
import type { Student, StudentFilters } from "@/types/student";
import type { Paginated } from "@/types/common";

type DbStudent = {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  other_names: string | null;
  date_of_birth: string;
  gender: "male" | "female";
  nationality: string;
  division: "nursery" | "kg" | "primary" | "jhs";
  class_id: string | null;
  academic_year: string;
  admission_date: string;
  address: string;
  previous_school: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
};

function toDomain(row: DbStudent): Student {
  return {
    id: row.id,
    admissionNumber: row.admission_number,
    firstName: row.first_name,
    lastName: row.last_name,
    otherNames: row.other_names ?? undefined,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    nationality: row.nationality,
    division: row.division,
    classId: row.class_id ?? "",
    className: "", // populated by a join when needed
    academicYear: row.academic_year,
    admissionDate: row.admission_date,
    address: row.address,
    previousSchool: row.previous_school ?? undefined,
    status: row.status,
    guardian: {
      id: "",
      fullName: "",
      relationship: "guardian",
      phone: "",
      address: "",
      isEmergencyContact: false,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const studentsService = {
  async list(
    filters: StudentFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Student>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("students")
      .select("*, classes(name)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.search) {
      const q = `%${filters.search}%`;
      query = query.or(
        `first_name.ilike.${q},last_name.ilike.${q},admission_number.ilike.${q}`,
      );
    }
    if (filters.division && filters.division !== "all") {
      query = query.eq("division", filters.division);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.classId && filters.classId !== "all") {
      query = query.eq("class_id", filters.classId);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (
        data as unknown as Array<DbStudent & { classes?: { name: string } }>
      ).map((row) => ({
        ...toDomain(row),
        className: row.classes?.name ?? "",
      })),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Student | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("students")
      .select("*, classes(name), guardians(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const row = data as unknown as DbStudent & {
      classes?: { name: string };
      guardians?: Array<{
        id: string;
        full_name: string;
        relationship: "mother" | "father" | "guardian";
        phone: string;
        email: string | null;
        address: string;
        is_emergency_contact: boolean;
      }>;
    };

    const student = toDomain(row);
    student.className = row.classes?.name ?? "";
    const g = row.guardians?.[0];
    if (g) {
      student.guardian = {
        id: g.id,
        fullName: g.full_name,
        relationship: g.relationship,
        phone: g.phone,
        email: g.email ?? undefined,
        address: g.address,
        isEmergencyContact: g.is_emergency_contact,
      };
    }
    return student;
  },

  async findByAdmission(admissionNumber: string): Promise<Student | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .ilike("admission_number", admissionNumber)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return toDomain(data as unknown as DbStudent);
  },

  async create(values: {
    firstName: string;
    lastName: string;
    otherNames?: string;
    dateOfBirth: string;
    gender: "male" | "female";
    nationality: string;
    division: "nursery" | "kg" | "primary" | "jhs";
    classId: string;
    academicYear: string;
    admissionDate: string;
    address: string;
    previousSchool?: string;
    guardian: {
      fullName: string;
      relationship: "mother" | "father" | "guardian";
      phone: string;
      email?: string;
      address: string;
      isEmergencyContact: boolean;
    };
  }): Promise<Student> {
    const supabase = requireSupabase();

    // Generate an admission number
    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });
    const next = (count ?? 0) + 1;
    const year = new Date().getFullYear();
    const admissionNumber = `SA-${year}-${String(next).padStart(4, "0")}`;

    const { data, error } = await supabase
      .from("students")
      .insert({
        admission_number: admissionNumber,
        first_name: values.firstName,
        last_name: values.lastName,
        other_names: values.otherNames ?? null,
        date_of_birth: values.dateOfBirth,
        gender: values.gender,
        nationality: values.nationality,
        division: values.division,
        class_id: values.classId || null,
        academic_year: values.academicYear,
        admission_date: values.admissionDate,
        address: values.address,
        previous_school: values.previousSchool ?? null,
        status: "active",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Insert the guardian
    await supabase.from("guardians").insert({
      student_id: data.id,
      full_name: values.guardian.fullName,
      relationship: values.guardian.relationship,
      phone: values.guardian.phone,
      email: values.guardian.email ?? null,
      address: values.guardian.address,
      is_emergency_contact: values.guardian.isEmergencyContact,
    });

    return toDomain(data as unknown as DbStudent);
  },

  async update(
    id: string,
    values: Partial<{
      firstName: string;
      lastName: string;
      otherNames: string;
      dateOfBirth: string;
      gender: "male" | "female";
      nationality: string;
      division: "nursery" | "kg" | "primary" | "jhs";
      classId: string;
      academicYear: string;
      admissionDate: string;
      address: string;
      previousSchool: string;
      status: "active" | "inactive" | "archived";
    }>,
  ): Promise<Student> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("students")
      .update({
        ...(values.firstName !== undefined && { first_name: values.firstName }),
        ...(values.lastName !== undefined && { last_name: values.lastName }),
        ...(values.otherNames !== undefined && {
          other_names: values.otherNames,
        }),
        ...(values.dateOfBirth !== undefined && {
          date_of_birth: values.dateOfBirth,
        }),
        ...(values.gender !== undefined && { gender: values.gender }),
        ...(values.nationality !== undefined && {
          nationality: values.nationality,
        }),
        ...(values.division !== undefined && { division: values.division }),
        ...(values.classId !== undefined && {
          class_id: values.classId || null,
        }),
        ...(values.academicYear !== undefined && {
          academic_year: values.academicYear,
        }),
        ...(values.admissionDate !== undefined && {
          admission_date: values.admissionDate,
        }),
        ...(values.address !== undefined && { address: values.address }),
        ...(values.previousSchool !== undefined && {
          previous_school: values.previousSchool,
        }),
        ...(values.status !== undefined && { status: values.status }),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbStudent);
  },

  async remove(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
