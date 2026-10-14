import type { UUID, Status } from "./common";

export type StaffCategory = "teaching" | "non_teaching";

export type EmploymentStatus = "full_time" | "part_time" | "contract";

export type StaffSystemRole = "headmaster" | "teacher" | "secretary";

export type Staff = {
  id: UUID;
  staffId: string; // e.g. "TCH001"
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
  photoUrl?: string;

  // Portal access (mirrored from the linked profile if one exists)
  systemRole?: StaffSystemRole | null;
  accountStatus: Status;

  // Set when this staff member has a linked login
  loginUserId?: UUID;

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
  systemRole?: StaffSystemRole | null;
  accountStatus: Status;
};

/** Returned by staffService.create() — includes the login result if one was made */
export type StaffCreateResult = {
  staff: Staff;
  loginCreated: boolean;
  loginEmail?: string;
};

export type StaffFilters = {
  search?: string;
  category?: StaffCategory | "all";
  employmentStatus?: EmploymentStatus | "all";
  accountStatus?: Status | "all";
};
