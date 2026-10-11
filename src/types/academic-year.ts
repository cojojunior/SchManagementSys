import type { UUID } from "./common";

export type TermName = "Term 1" | "Term 2" | "Term 3";

export type AcademicTerm = {
  id: UUID;
  academicYearId: UUID;
  name: TermName;
  startDate: string; // ISO date
  endDate: string; // ISO date
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AcademicYear = {
  id: UUID;
  name: string; // e.g. "2024/2025"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: "active" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type AcademicYearFormValues = {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: "active" | "closed";
};

export type AcademicTermFormValues = {
  academicYearId: UUID;
  name: TermName;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};
