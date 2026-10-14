import { requireSupabase } from "@/lib/supabase";
import type {
  AcademicYear,
  AcademicYearFormValues,
  AcademicTerm,
  AcademicTermFormValues,
} from "@/types/academic-year";

type DbYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
};

type DbTerm = {
  id: string;
  academic_year_id: string;
  name: "Term 1" | "Term 2" | "Term 3";
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

function toYear(row: DbYear): AcademicYear {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTerm(row: DbTerm): AcademicTerm {
  return {
    id: row.id,
    academicYearId: row.academic_year_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const academicYearsService = {
  // ---------- Years ----------
  async listYears(): Promise<AcademicYear[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .order("name", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as DbYear[]).map(toYear);
  },

  async getYear(id: string): Promise<AcademicYear | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toYear(data as unknown as DbYear) : null;
  },

  async getCurrentYear(): Promise<AcademicYear | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .eq("is_current", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toYear(data as unknown as DbYear) : null;
  },

  async createYear(values: AcademicYearFormValues): Promise<AcademicYear> {
    const supabase = requireSupabase();

    if (values.isCurrent) {
      await supabase
        .from("academic_years")
        .update({ is_current: false })
        .eq("is_current", true);
    }

    const { data, error } = await supabase
      .from("academic_years")
      .insert({
        name: values.name,
        start_date: values.startDate,
        end_date: values.endDate,
        is_current: values.isCurrent,
        status: values.status,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toYear(data as unknown as DbYear);
  },

  async updateYear(
    id: string,
    values: AcademicYearFormValues,
  ): Promise<AcademicYear> {
    const supabase = requireSupabase();

    if (values.isCurrent) {
      await supabase
        .from("academic_years")
        .update({ is_current: false })
        .neq("id", id);
    }

    const { data, error } = await supabase
      .from("academic_years")
      .update({
        name: values.name,
        start_date: values.startDate,
        end_date: values.endDate,
        is_current: values.isCurrent,
        status: values.status,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toYear(data as unknown as DbYear);
  },

  async setCurrentYear(id: string): Promise<void> {
    const supabase = requireSupabase();
    await supabase
      .from("academic_years")
      .update({ is_current: false })
      .eq("is_current", true);
    const { error } = await supabase
      .from("academic_years")
      .update({ is_current: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async removeYear(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("academic_years")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  // ---------- Terms ----------
  async listTerms(academicYearId?: string): Promise<AcademicTerm[]> {
    const supabase = requireSupabase();
    let query = supabase
      .from("terms")
      .select("*, academic_years(name)")
      .order("name");
    if (academicYearId) {
      query = query.eq("academic_year_id", academicYearId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (
      data as unknown as Array<
        DbTerm & { academic_years?: { name: string } | null }
      >
    ).map((row) => {
      const term = toTerm(row);
      term.academicYearName = row.academic_years?.name ?? "";
      return term;
    });
  },

  async getTerm(id: string): Promise<AcademicTerm | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("terms")
      .select("*, academic_years(name)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const term = toTerm(data as unknown as DbTerm);
    term.academicYearName =
      (data as unknown as { academic_years?: { name: string } | null })
        .academic_years?.name ?? "";
    return term;
  },

  async getCurrentTerm(): Promise<AcademicTerm | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("terms")
      .select("*, academic_years(name)")
      .eq("is_current", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const term = toTerm(data as unknown as DbTerm);
    term.academicYearName =
      (data as unknown as { academic_years?: { name: string } | null })
        .academic_years?.name ?? "";
    return term;
  },

  async createTerm(values: AcademicTermFormValues): Promise<AcademicTerm> {
    const supabase = requireSupabase();

    if (values.isCurrent) {
      await supabase
        .from("terms")
        .update({ is_current: false })
        .eq("is_current", true);
    }

    const { data, error } = await supabase
      .from("terms")
      .insert({
        academic_year_id: values.academicYearId,
        name: values.name,
        start_date: values.startDate,
        end_date: values.endDate,
        is_current: values.isCurrent,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toTerm(data as unknown as DbTerm);
  },

  async updateTerm(
    id: string,
    values: AcademicTermFormValues,
  ): Promise<AcademicTerm> {
    const supabase = requireSupabase();

    if (values.isCurrent) {
      await supabase.from("terms").update({ is_current: false }).neq("id", id);
    }

    const { data, error } = await supabase
      .from("terms")
      .update({
        name: values.name,
        start_date: values.startDate,
        end_date: values.endDate,
        is_current: values.isCurrent,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toTerm(data as unknown as DbTerm);
  },

  async setCurrentTerm(id: string): Promise<void> {
    const supabase = requireSupabase();
    await supabase
      .from("terms")
      .update({ is_current: false })
      .eq("is_current", true);
    const { error } = await supabase
      .from("terms")
      .update({ is_current: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async removeTerm(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.from("terms").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
