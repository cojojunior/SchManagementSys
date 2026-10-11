import type { UUID } from "./common";

export type AssessmentWeight = {
  id: UUID;
  assessmentPercent: number; // 0–100, e.g. 40
  examPercent: number; // 0–100, e.g. 60
  updatedAt: string;
};

export type AssessmentWeightFormValues = {
  assessmentPercent: number;
  examPercent: number;
};
