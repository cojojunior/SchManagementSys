export const APP_NAME = "Supreme Academy";
export const CURRENCY_CODE = "GHS";
export const CURRENCY_SYMBOL = "GH₵";
export const TIMEZONE = "Africa/Accra";

export const ROLES = [
  "super_admin",
  "headmaster",
  "teacher",
  "secretary",
  "student",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  headmaster: "Headmaster",
  teacher: "Teacher",
  secretary: "Secretary",
  student: "Student",
};

export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/admin",
  headmaster: "/headmaster",
  teacher: "/teacher",
  secretary: "/secretary",
  student: "/student",
};
