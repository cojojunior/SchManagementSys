import { requireSupabase } from "@/lib/supabase";
import type { Role } from "@/lib/constants";
import type {
  AccountStatus,
  ProvisionUserValues,
  RoleChangeLogEntry,
  UserFilters,
  UserProfile,
} from "@/types/users";
import type { Paginated } from "@/types/common";

type DbProfile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  status: "active" | "inactive" | "suspended" | "archived";
  student_id: string | null;
  staff_id: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

function toDomain(row: DbProfile): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone ?? undefined,
    role: row.role,
    status: row.status,
    studentId: row.student_id ?? undefined,
    staffId: row.staff_id ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const usersService = {
  async list(
    filters: UserFilters = {},
    page = 1,
    pageSize = 20,
  ): Promise<Paginated<UserProfile>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.search) {
      const q = `%${filters.search}%`;
      query = query.or(`full_name.ilike.${q},email.ilike.${q}`);
    }
    if (filters.role && filters.role !== "all") {
      query = query.eq("role", filters.role);
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbProfile[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<UserProfile | null> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DbProfile) : null;
  },

  /**
   * Create a new staff account.
   * Calls the `provision-user` Edge Function which runs with service_role.
   */
  async provisionUser(
    values: ProvisionUserValues,
  ): Promise<{ userId: string }> {
    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke<{
      ok: boolean;
      reason?: string;
      userId?: string;
    }>("provision-user", { body: values });

    if (error) throw new Error(error.message);
    if (!data?.ok || !data.userId) {
      throw new Error(data?.reason ?? "Could not create user");
    }
    return { userId: data.userId };
  },

  async setStatus(
    id: string,
    status: "active" | "inactive" | "suspended" | "archived",
  ): Promise<void> {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async resetToDefault(userId: string): Promise<void> {
    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke<{
      ok: boolean;
      reason?: string;
    }>("reset-staff-password", { body: { userId } });

    if (error) throw new Error(error.message);
    if (!data?.ok) {
      throw new Error(data?.reason ?? "Could not reset password");
    }
  },

  async roleHistory(profileId: string): Promise<RoleChangeLogEntry[]> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("role_history")
      .select("*, profiles!actor_id(full_name)")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (
      data as unknown as Array<{
        id: string;
        profile_id: string;
        actor_id: string | null;
        previous_role: Role | null;
        new_role: Role;
        previous_status: AccountStatus | null;
        new_status: AccountStatus;
        reason: string | null;
        created_at: string;
        profiles?: { full_name: string } | null;
      }>
    ).map((r) => ({
      id: r.id,
      profileId: r.profile_id,
      actorName: r.profiles?.full_name ?? "System",
      previousRole: r.previous_role ?? undefined,
      newRole: r.new_role,
      previousStatus: r.previous_status ?? undefined,
      newStatus: r.new_status,
      reason: r.reason ?? undefined,
      createdAt: r.created_at,
    }));
  },
};
