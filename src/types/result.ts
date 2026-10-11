import type { UUID } from "./common";

export type ResultStatus =
  "draft" | "submitted" | "returned" | "approved" | "published" | "locked";

export type AssessmentResult = {
  assessmentId: UUID;
  classId: UUID;
  className: string;
  subjectId: UUID;
  subjectName: string;
  subjectCode: string;
  academicYear: string;
  termId: UUID;
  termName: string;
  teacherId?: UUID;
  teacherName?: string;
  status: ResultStatus;
  studentCount: number;
  classAverage: number; // 0..100
  highest: number;
  lowest: number;
  submittedAt?: string;
  reviewedAt?: string;
  publishedAt?: string;
  lockedAt?: string;
  headmasterRemark?: string; // optional overall remark for the class
};

export type ResultChangeLog = {
  id: UUID;
  assessmentId: UUID;
  actorName: string;
  action:
    "submitted" | "returned" | "approved" | "published" | "locked" | "edited";
  reason?: string;
  before?: string;
  after?: string;
  createdAt: string;
};

export type ResultFilters = {
  search?: string;
  status?: ResultStatus | "all";
  classId?: UUID | "all";
  subjectId?: UUID | "all";
  termId?: UUID | "all";
};
