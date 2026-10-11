import type { UUID, Division } from "./common";

export type GradeBand = {
  id: UUID;
  scaleId: UUID;
  grade: string; // "1" | "2" ... "9" | "E" | "VG" | "G" | "D"
  label: string; // "Excellent" | "Very Good" | ...
  minScore: number; // inclusive
  maxScore: number; // inclusive
  remark?: string; // optional descriptive remark
  orderIndex: number; // for display ordering (best → worst)
};

export type GradingScale = {
  id: UUID;
  name: string; // e.g. "Primary & JHS (BECE 1–9)"
  description?: string;
  divisions: Division[]; // which divisions this scale applies to
  type: "numeric" | "descriptive";
  isActive: boolean;
  bands: GradeBand[];
  createdAt: string;
  updatedAt: string;
};

export type GradingScaleFormValues = {
  name: string;
  description?: string;
  divisions: Division[];
  type: "numeric" | "descriptive";
  isActive: boolean;
  bands: Array<Omit<GradeBand, "id" | "scaleId">>;
};
