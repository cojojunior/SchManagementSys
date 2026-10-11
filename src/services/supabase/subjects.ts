import { requireSupabase } from "@/lib/supabase";
import type {
  Subject,
  SubjectFilters,
  SubjectFormValues,
} from "@/types/subjects";
import type { Paginated } from "@/types/common";

type DbSubject = {
  id: string;
  code: string;
  name: string;
  divisions: Array<"nursery" | "kg" | "primary" | "jhs">;
  is_core: boolean;
  description: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
};

function toDomain(row: DbSubject): Subject {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    divisions: row.divisions,
    isCore: row.is_core,
    description: row.description ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const subjectsService = {
  async list(
    filters: SubjectFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Subject>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("subjects")
      .select("*", { count: "exact" })
      .order("code", { ascending: true });

    if (filters.search) {
      const q = `%${filters.search}%`;
      query = query.or(`name.ilike.${q},code.ilike.${q}`);
    }
    if (filters.division && filters.division !== "all") {
      query = query.contains("divisions", [filters.division]);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbSubject[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Subject | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return toDomain(data as unknown as DbSubject);
  },

  async create(values: SubjectFormValues): Promise<Subject> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("subjects")
      .insert({
        code: values.code,
        name: values.name,
        divisions: values.divisions,
        is_core: values.isCore,
        description: values.description ?? null,
        status: values.status,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbSubject);
  },

  async update(id: string, values: SubjectFormValues): Promise<Subject> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("subjects")
      .update({
        code: values.code,
        name: values.name,
        divisions: values.divisions,
        is_core: values.isCore,
        description: values.description ?? null,
        status: values.status,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toDomain(data as unknown as DbSubject);
  },

  async remove(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
