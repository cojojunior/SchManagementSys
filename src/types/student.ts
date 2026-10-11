import type { UUID, Division, Gender, Status } from "./common";

export type Guardian = {
  id: UUID;
  fullName: string;
  relationship: "mother" | "father" | "guardian";
  phone: string;
  email?: string;
  address: string;
  isEmergencyContact: boolean;
};

export type Student = {
  id: UUID;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  nationality: string;
  division: Division;
  classId: UUID;
  className: string; // denormalized for display
  stream?: string;
  academicYear: string; // e.g. "2024/2025"
  admissionDate: string;
  status: Status;
  photoUrl?: string;
  guardian: Guardian;
  previousSchool?: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentFormValues = Omit<
  Student,
  "id" | "createdAt" | "updatedAt" | "className" | "guardian"
> & {
  guardian: Omit<Guardian, "id">;
};

export type StudentFilters = {
  search?: string;
  division?: Division | "all";
  status?: Status | "all";
  classId?: UUID | "all";
};