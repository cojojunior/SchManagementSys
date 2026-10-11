import type { UUID, Status } from "./common";
import type { Role } from "@/lib/constants";

export type StaffCategory = "teaching" | "non_teaching";

export type EmploymentStatus = "full_time" | "part_time" | "contract";

export type Staff = {
  id: UUID;
  staffId: string; // e.g. "SA-STF-0001"
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth: string; // ISO date
  gender: "male" | "female";
  phone: string;
  email: string;
  address: string;

  category: StaffCategory;
  department?: string; // e.g. "Mathematics", "Administration"
  jobTitle: string; // e.g. "Mathematics Teacher", "Bursar"
  employmentStatus: EmploymentStatus;
  dateHired: string; // ISO date

  qualification?: string; // e.g. "B.Ed Mathematics"
  photoUrl?: string;

  // Portal access
  systemRole?: Role | null; // null = no portal access
  accountStatus: Status; // active / inactive / archived

  createdAt: string;
  updatedAt: string;
};

export type StaffFormValues = {
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth: string;
  gender: "male" | "female";
  phone: string;
  email: string;
  address: string;
  category: StaffCategory;
  department?: string;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
  dateHired: string;
  qualification?: string;
  systemRole?: Role | null;
  accountStatus: Status;
};

export type StaffFilters = {
  search?: string;
  category?: StaffCategory | "all";
  employmentStatus?: EmploymentStatus | "all";
  accountStatus?: Status | "all";
};
