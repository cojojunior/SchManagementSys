import { requireSupabase } from "@/lib/supabase";
import type { GradingScale, GradingScaleFormValues } from "@/types/grading";
import type { Division } from "@/types/common";

type DbScale = {
  id: string;
  name: string;
  description: string | null;
  divisions: Division[];
  type: "numeric" | "descriptive";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DbBand = {
  id: string;
  scale_id: string;
  grade: string;
  label: string;
  min_score: number;
  max_score: number;
  remark: string | null;
  order_index: number;
};

async function loadBands(scaleId: string): Promise<DbBand[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("grade_bands")
    .select("*")
    .eq("scale_id", scaleId)
    .order("order_index");
  if (error) throw new Error(error.message);
  return data as unknown as DbBand[];
}

function toDomain(row: DbScale, bands: DbBand[]): GradingScale {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    divisions: row.divisions,
    type: row.type,
    isActive: row.is_active,
    bands: bands.map((b) => ({
      id: b.id,
      scaleId: b.scale_id,
      grade: b.grade,
      label: b.label,
      minScore: b.min_score,
      maxScore: b.max_score,
      remark: b.remark ?? undefined,
      orderIndex: b.order_index,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const gradingService = {
  async list(): Promise<GradingScale[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("grading_scales")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);

    const rows = data as unknown as DbScale[];
    return Promise.all(
      rows.map(async (r) => toDomain(r, await loadBands(r.id))),
    );
  },

  async get(id: string): Promise<GradingScale | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("grading_scales")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return toDomain(data as unknown as DbScale, await loadBands(id));
  },

  async getForDivision(division: Division): Promise<GradingScale | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("grading_scales")
      .select("*")
      .eq("is_active", true)
      .contains("divisions", [division])
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as unknown as DbScale;
    return toDomain(row, await loadBands(row.id));
  },

  async create(values: GradingScaleFormValues): Promise<GradingScale> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("grading_scales")
      .insert({
        name: values.name,
        description: values.description ?? null,
        divisions: values.divisions,
        type: values.type,
        is_active: values.isActive,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const scale = data as unknown as DbScale;

    await supabase.from("grade_bands").insert(
      values.bands.map((b) => ({
        scale_id: scale.id,
        grade: b.grade,
        label: b.label,
        min_score: b.minScore,
        max_score: b.maxScore,
        remark: b.remark ?? null,
        order_index: b.orderIndex,
      })),
    );

    return (await this.get(scale.id))!;
  },

  async update(
    id: string,
    values: GradingScaleFormValues,
  ): Promise<GradingScale> {
    const supabase = requireSupabase();

    await supabase
      .from("grading_scales")
      .update({
        name: values.name,
        description: values.description ?? null,
        divisions: values.divisions,
        type: values.type,
        is_active: values.isActive,
      })
      .eq("id", id);

    // Replace bands
    await supabase.from("grade_bands").delete().eq("scale_id", id);
    await supabase.from("grade_bands").insert(
      values.bands.map((b) => ({
        scale_id: id,
        grade: b.grade,
        label: b.label,
        min_score: b.minScore,
        max_score: b.maxScore,
        remark: b.remark ?? null,
        order_index: b.orderIndex,
      })),
    );

    return (await this.get(id))!;
  },

  async remove(id: string): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("grading_scales")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};
