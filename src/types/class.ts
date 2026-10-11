import type { UUID, Division, Status } from "./common";

export type SchoolClass = {
  id: UUID;
  name: string; // e.g. "JHS 2", "Primary 4", "Nursery 1"
  division: Division;
  level: number; // e.g. 1..6 for Primary, 1..3 for JHS, 1..2 for Nursery/KG
  stream?: string; // optional — unused in the current school structure
  classTeacherId?: UUID;
  classTeacherName?: string; // denormalized
  capacity: number;
  studentCount: number; // computed (mock for now; derived from students table later)
  academicYear: string; // "2024/2025"
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export type ClassFormValues = {
  name: string;
  division: Division;
  level: number;
  stream?: string;
  classTeacherId?: UUID;
  capacity: number;
  academicYear: string;
  status: Status;
};

export type ClassFilters = {
  search?: string;
  division?: Division | "all";
  status?: Status | "all";
  academicYear?: string | "all";
};
