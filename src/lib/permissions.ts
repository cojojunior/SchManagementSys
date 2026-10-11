import type { Role } from "./constants";

export type Resource =
  | "students"
  | "guardians"
  | "staff"
  | "classes"
  | "subjects"
  | "teaching_assignments"
  | "academic_years"
  | "terms"
  | "assessments"
  | "scores"
  | "results"
  | "fees"
  | "payments"
  | "invoices"
  | "scratch_cards"
  | "school_settings"
  | "users"
  | "audit_log";

export type Action =
  "create" | "read" | "update" | "delete" | "archive" | "publish" | "approve";

// Deny by default. This matrix is the source of truth for the frontend.
// When Supabase RLS is added in Phase 6, the policies must mirror these rules exactly.
const MATRIX: Record<Resource, Partial<Record<Role, Action[]>>> = {
  students: {
    super_admin: ["create", "read", "update", "delete", "archive"],
    headmaster: ["read"],
    teacher: ["read"], // scoped to assigned classes (service-layer filter)
    secretary: ["create", "read", "update"],
    student: ["read"], // scoped to self
  },
  guardians: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    secretary: ["create", "read", "update"],
    student: ["read"], // scoped to self
  },
  staff: {
    super_admin: ["create", "read", "update", "delete", "archive"],
    headmaster: ["read"],
    secretary: ["create", "read", "update"],
  },
  classes: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    teacher: ["read"], // scoped to assigned classes
    secretary: ["read"],
    student: ["read"], // scoped to own class
  },
  subjects: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    teacher: ["read"],
    secretary: ["read"],
    student: ["read"],
  },
  teaching_assignments: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    teacher: ["read"], // scoped to own assignments
    student: ["read"], // scoped to own class's assignments
  },
  academic_years: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    teacher: ["read"],
    secretary: ["read"],
    student: ["read"],
  },
  terms: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    teacher: ["read"],
    secretary: ["read"],
    student: ["read"],
  },
  assessments: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    teacher: ["create", "read", "update"], // scoped to assigned
  },
  scores: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read", "update", "approve"], // can edit with audit
    teacher: ["create", "read", "update", "delete"], // scoped + draft-only
    student: ["read"], // published only
  },
  results: {
    super_admin: ["read", "publish"],
    headmaster: ["read", "update", "approve", "publish"],
    teacher: ["read"], // own submissions
    student: ["read"], // published only
  },
  fees: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    secretary: ["read"],
    student: ["read"],
  },
  payments: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    secretary: ["create", "read", "update"],
    student: ["read"],
  },
  invoices: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    secretary: ["create", "read", "update"],
    student: ["read"],
  },
  scratch_cards: {
    super_admin: ["create", "read", "update", "delete"],
    headmaster: ["read"],
    secretary: ["create", "read", "update"], // issue/sell only
    student: ["read"], // own redemptions
  },
  school_settings: {
    super_admin: ["create", "read", "update"],
    headmaster: ["read"],
    secretary: ["read"],
    teacher: ["read"],
    student: ["read"],
  },
  users: {
    super_admin: ["create", "read", "update", "delete"],
  },
  audit_log: {
    super_admin: ["read"],
    headmaster: ["read"], // scoped to own actions
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return MATRIX[resource]?.[role]?.includes(action) ?? false;
}

export function canAny(
  role: Role,
  resource: Resource,
  actions: Action[],
): boolean {
  return actions.some((a) => can(role, resource, a));
}
