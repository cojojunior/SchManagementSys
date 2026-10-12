import type { Role } from "@/lib/constants";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  studentId?: string;
  staffId?: string;
  mustChangePassword?: boolean;
};
