import { requireSupabase } from "@/lib/supabase";
import type {
  AssessmentWeight,
  AssessmentWeightFormValues,
} from "@/types/assessment-weight";

export const assessmentWeightService = {
  async get(): Promise<AssessmentWeight> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("assessment_weights")
      .select("*")
      .eq("id", 1)
      .single();
    if (error) throw new Error(error.message);
    return {
      id: "aw-current",
      assessmentPercent: data.assessment_percent,
      examPercent: data.exam_percent,
      updatedAt: data.updated_at,
    };
  },

  async update(values: AssessmentWeightFormValues): Promise<AssessmentWeight> {
    const supabase = requireSupabase();

    if (values.assessmentPercent + values.examPercent !== 100) {
      throw new Error("Assessment and Exam percentages must total 100.");
    }

    const { data, error } = await supabase
      .from("assessment_weights")
      .update({
        assessment_percent: values.assessmentPercent,
        exam_percent: values.examPercent,
      })
      .eq("id", 1)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return {
      id: "aw-current",
      assessmentPercent: data.assessment_percent,
      examPercent: data.exam_percent,
      updatedAt: data.updated_at,
    };
  },
};
