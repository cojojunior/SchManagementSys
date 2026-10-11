import type { GradeBand, GradingScale } from "@/types/grading";

export type CalculatedGrade = {
  finalScore: number;
  grade: string;
  gradeLabel: string;
  remark?: string;
};

/**
 * Round half-up to nearest integer.
 * 74.5 → 75; 74.4 → 74
 */
export function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5);
}

/**
 * Compute weighted final score from raw assessment & exam marks.
 * Returns a raw value (unrounded to 2 decimals).
 */
export function computeFinalScore(
  assessmentRaw: number | null,
  examRaw: number | null,
  maxAssessment: number,
  maxExam: number,
  assessmentPercent: number,
  examPercent: number,
): { assessmentWeighted: number; examWeighted: number; finalScore: number } {
  const a = assessmentRaw ?? 0;
  const e = examRaw ?? 0;

  // Normalize to 0..100 scale, then weight
  const assessmentWeighted =
    maxAssessment > 0 ? (a / maxAssessment) * assessmentPercent : 0;
  const examWeighted = maxExam > 0 ? (e / maxExam) * examPercent : 0;

  const finalScore = assessmentWeighted + examWeighted;
  return {
    assessmentWeighted: Math.round(assessmentWeighted * 100) / 100,
    examWeighted: Math.round(examWeighted * 100) / 100,
    finalScore: Math.round(finalScore * 100) / 100,
  };
}

/**
 * Look up the grade band that matches a final score (rounded half-up).
 */
export function findGradeBand(
  finalScore: number,
  scale: GradingScale,
): GradeBand | null {
  const rounded = roundHalfUp(finalScore);
  return (
    scale.bands.find((b) => rounded >= b.minScore && rounded <= b.maxScore) ??
    null
  );
}

/**
 * Full calculation: raw marks → weighted → grade.
 */
export function calculateGrade(
  assessmentRaw: number | null,
  examRaw: number | null,
  maxAssessment: number,
  maxExam: number,
  assessmentPercent: number,
  examPercent: number,
  scale: GradingScale,
): CalculatedGrade {
  const { finalScore } = computeFinalScore(
    assessmentRaw,
    examRaw,
    maxAssessment,
    maxExam,
    assessmentPercent,
    examPercent,
  );

  const band = findGradeBand(finalScore, scale);

  return {
    finalScore: Math.round(finalScore * 100) / 100,
    grade: band?.grade ?? "—",
    gradeLabel: band?.label ?? "—",
    remark: band?.remark,
  };
}