import type { UUID } from "./common";

export type AssessmentStatus = "draft" | "open" | "closed";

export type Assessment = {
  id: UUID;
  classId: UUID;
  className: string; // denormalized
  subjectId: UUID;
  subjectName: string; // denormalized
  subjectCode: string; // denormalized
  academicYear: string; // "2024/2025"
  termId: UUID;
  termName: string; // "Term 1"
  teacherId?: UUID; // optional — usually derived from teaching assignment
  teacherName?: string;
  status: AssessmentStatus;
  maxAssessmentScore: number; // e.g. 40 (out of 40 weighted assessment)
  maxExamScore: number; // e.g. 60 (out of 60 weighted exam)
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AssessmentFormValues = {
  classId: UUID;
  subjectId: UUID;
  academicYear: string;
  termId: UUID;
  teacherId?: UUID;
  status: AssessmentStatus;
  maxAssessmentScore: number;
  maxExamScore: number;
  dueDate?: string;
  notes?: string;
};

export type AssessmentFilters = {
  search?: string;
  classId?: UUID | "all";
  subjectId?: UUID | "all";
  termId?: UUID | "all";
  academicYear?: string | "all";
  status?: AssessmentStatus | "all";
};
