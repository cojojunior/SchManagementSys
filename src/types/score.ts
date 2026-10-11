import type { UUID } from "./common";

export type ScoreStatus = "draft" | "submitted" | "approved" | "published";

export type Score = {
  id: UUID;
  assessmentId: UUID;
  studentId: UUID;
  studentName: string; // denormalized
  admissionNumber: string; // denormalized
  assessmentRaw: number | null; // 0..maxAssessmentScore
  examRaw: number | null; // 0..maxExamScore
  assessmentWeighted: number; // computed
  examWeighted: number; // computed
  finalScore: number; // 0..100
  grade: string; // computed from grading scale
  gradeLabel: string; // computed
  remark?: string; // teacher remark
  status: ScoreStatus;
  updatedAt: string;
};

export type MarkEntryRow = {
  studentId: UUID;
  studentName: string;
  admissionNumber: string;
  assessmentRaw: number | null;
  examRaw: number | null;
  assessmentWeighted: number;
  examWeighted: number;
  finalScore: number;
  grade: string;
  gradeLabel: string;
  remark?: string;
};

export type SaveScoresPayload = {
  assessmentId: UUID;
  rows: MarkEntryRow[];
};
