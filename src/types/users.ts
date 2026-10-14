import type { UUID } from "./common";
import type { Role } from "@/lib/constants";

export type AccountStatus = "active" | "inactive" | "suspended" | "archived";

export type UserProfile = {
  id: UUID;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  status: AccountStatus;
  studentId?: UUID;
  staffId?: UUID;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserFilters = {
  search?: string;
  role?: Role | "all";
  status?: AccountStatus | "all";
};

export type ProvisionUserValues = {
  email: string;
  password: string;
  fullName: string;
  role: "headmaster" | "teacher" | "secretary";
};

export type RoleChangeLogEntry = {
  id: UUID;
  profileId: UUID;
  actorName?: string;
  previousRole?: Role;
  newRole: Role;
  previousStatus?: AccountStatus;
  newStatus: AccountStatus;
  reason?: string;
  createdAt: string;
};
