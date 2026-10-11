import { requireSupabase } from "@/lib/supabase";
import type {
  FeeStructure,
  FeeStructureFilters,
  FeeStructureFormValues,
} from "@/types/finance";
import type { Paginated } from "@/types/common";
import type { Division } from "@/types/common";

type DbFeeStructure = {
  id: string;
  name: string;
  division: Division;
  class_id: string | null;
  academic_year: string;
  term_id: string;
  status: "active" | "inactive" | "archived";
  total: number;
  created_at: string;
  updated_at: string;
  classes?: { name: string } | null;
  terms?: { name: string } | null;
  fee_items?: DbFeeItem[];
};

type DbFeeItem = {
  id: string;
  fee_structure_id: string;
  name: string;
  category: string;
  amount: number;
  description: string | null;
  order_index: number;
};

const SELECT = "*, classes(name), terms(name), fee_items(*)";

function toDomain(row: DbFeeStructure): FeeStructure {
  return {
    id: row.id,
    name: row.name,
    division: row.division,
    classId: row.class_id ?? undefined,
    className: row.classes?.name,
    academicYear: row.academic_year,
    termId: row.term_id,
    termName: row.terms?.name ?? "—",
    items: (row.fee_items ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category as FeeStructure["items"][number]["category"],
      amount: Number(i.amount),
      description: i.description ?? undefined,
    })),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const feeStructuresService = {
  async list(
    filters: FeeStructureFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<FeeStructure>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("fee_structures")
      .select(SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }
    if (filters.division && filters.division !== "all") {
      query = query.eq("division", filters.division);
    }
    if (filters.termId && filters.termId !== "all") {
      query = query.eq("term_id", filters.termId);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbFeeStructure[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<FeeStructure | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("fee_structures")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DbFeeStructure) : null;
  },

  async findForStudent(
    division: Division,
    classId: string | undefined,
    termId: string,
    academicYear: string,
  ): Promise<FeeStructure | null> {
    const supabase = requireSupabase();

    if (classId) {
      const { data } = await supabase
        .from("fee_structures")
        .select(SELECT)
        .eq("status", "active")
        .eq("class_id", classId)
        .eq("term_id", termId)
        .eq("academic_year", academicYear)
        .maybeSingle();
      if (data) return toDomain(data as unknown as DbFeeStructure);
    }

    const { data } = await supabase
      .from("fee_structures")
      .select(SELECT)
      .eq("status", "active")
      .is("class_id", null)
      .eq("division", division)
      .eq("term_id", termId)
      .eq("academic_year", academicYear)
      .maybeSingle();
    return data ? toDomain(data as unknown as DbFeeStructure) : null;
  },

  async create(values: FeeStructureFormValues): Promise<FeeStructure> {
    const supabase = requireSupabase();

    const total = values.items.reduce((s, i) => s + (i.amount || 0), 0);

    const { data, error } = await supabase
      .from("fee_structures")
      .insert({
        name: values.name,
        division: values.division,
        class_id: values.classId ?? null,
        academic_year: values.academicYear,
        term_id: values.termId,
        status: values.status,
        total,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("fee_items").insert(
      values.items.map((i, idx) => ({
        fee_structure_id: data.id,
        name: i.name,
        category: i.category,
        amount: i.amount,
        description: i.description ?? null,
        order_index: idx + 1,
      })),
    );

    return (await this.get(data.id))!;
  },

  async update(
    id: string,
    values: FeeStructureFormValues,
  ): Promise<FeeStructure> {
    const supabase = requireSupabase();

    const total = values.items.reduce((s, i) => s + (i.amount || 0), 0);

    await supabase
      .from("fee_structures")
      .update({
        name: values.name,
        division: values.division,
        class_id: values.classId ?? null,
        academic_year: values.academicYear,
        term_id: values.termId,
        status: values.status,
        total,
      })
      .eq("id", id);

    // Replace items
    await supabase.from("fee_items").delete().eq("fee_structure_id", id);
    await supabase.from("fee_items").insert(
      values.items.map((i, idx) => ({
        fee_structure_id: id,
        name: i.name,
        category: i.category,
        amount: i.amount,
        description: i.description ?? null,
        order_index: idx + 1,
      })),
    );

    return (await this.get(id))!;
  },

  async remove(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("fee_structures")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
