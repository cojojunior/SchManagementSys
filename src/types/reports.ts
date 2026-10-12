import type { UUID } from "./common";

export type EnrollmentReport = {
  totalStudents: number;
  activeStudents: number;
  byDivision: Array<{ division: string; count: number }>;
  byClass: Array<{ classId: UUID; className: string; count: number }>;
  byGender: Array<{ gender: string; count: number }>;
};

export type PerformanceReport = {
  termId: UUID;
  termName: string;
  academicYear: string;
  bySubject: Array<{
    subjectId: UUID;
    subjectName: string;
    average: number;
    highest: number;
    lowest: number;
    count: number;
  }>;
  gradeDistribution: Array<{ grade: string; count: number }>;
  overallAverage: number;
};

export type FinanceReport = {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  byMethod: Array<{ method: string; amount: number; count: number }>;
  byDivision: Array<{
    division: string;
    billed: number;
    collected: number;
    outstanding: number;
  }>;
};

export type TeacherReport = {
  className: string;
  subjectName: string;
  studentCount: number;
  marksEntered: number;
  classAverage: number;
  highest: number;
  lowest: number;
};
