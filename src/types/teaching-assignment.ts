import type { UUID } from "./common";

export type TeachingAssignment = {
  id: UUID;
  staffId: UUID;
  staffName: string; // denormalized: "Yaw Owusu"
  classId: UUID;
  className: string; // denormalized: "JHS 2"
  subjectId: UUID;
  subjectName: string; // denormalized: "Mathematics"
  subjectCode: string; // denormalized: "MATH"
  academicYear: string; // "2024/2025"
  termId?: UUID; // optional — leave blank for full-year assignment
  termName?: string; // denormalized: "Term 1"
  periodsPerWeek?: number; // optional
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeachingAssignmentFormValues = {
  staffId: UUID;
  classId: UUID;
  subjectId: UUID;
  academicYear: string;
  termId?: UUID;
  periodsPerWeek?: number;
  notes?: string;
  isActive: boolean;
};

export type TeachingAssignmentFilters = {
  search?: string;
  staffId?: UUID | "all";
  classId?: UUID | "all";
  subjectId?: UUID | "all";
  academicYear?: string | "all";
  isActive?: "true" | "false" | "all";
  teacherId?: string | "all";
};
