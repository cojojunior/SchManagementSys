import { requireSupabase } from "@/lib/supabase";
import type {
  ReportCardProficiencyRow,
  ProficiencyArea,
  ProficiencyRating,
} from "@/types/report-card";

type Row = {
  area: ProficiencyArea;
  rating: ProficiencyRating | null;
};

function toDomain(r: Row): ReportCardProficiencyRow {
  return { area: r.area, rating: r.rating };
}

export const proficiencyRatingsService = {
  async list(
    studentId: string,
    termId: string,
  ): Promise<ReportCardProficiencyRow[]> {
    const { data, error } = await requireSupabase()
      .from("proficiency_ratings")
      .select("area, rating")
      .eq("student_id", studentId)
      .eq("term_id", termId);

    if (error) throw error;
    return (data ?? []).map(toDomain);
  },

  async upsert(
    studentId: string,
    termId: string,
    area: ProficiencyArea,
    rating: ProficiencyRating | null,
  ): Promise<void> {
    const { error } = await requireSupabase()
      .from("proficiency_ratings")
      .upsert(
        { student_id: studentId, term_id: termId, area, rating },
        { onConflict: "student_id,term_id,area" },
      );
    if (error) throw error;
  },
};
