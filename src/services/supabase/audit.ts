import { requireSupabase } from "@/lib/supabase";
import { pickOne } from "@/lib/pick-one";
import type { AuditLogEntry, AuditLogFilters } from "@/types/audit";
import type { Paginated } from "@/types/common";

type Joined<T> = T | T[] | null;

type DbAuditLog = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before_value: unknown;
  after_value: unknown;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: Joined<{ full_name: string }>;
};

const SELECT = "*, profiles!actor_id(full_name)";

function toDomain(row: DbAuditLog): AuditLogEntry {
  const actorProfile = pickOne(row.profiles);
  return {
    id: row.id,
    actorId: row.actor_id ?? undefined,
    actorName: row.actor_name ?? actorProfile?.full_name ?? "System",
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id ?? undefined,
    beforeValue: row.before_value,
    afterValue: row.after_value,
    reason: row.reason ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    userAgent: row.user_agent ?? undefined,
    createdAt: row.created_at,
  };
}

export const auditService = {
  async list(
    filters: AuditLogFilters = {},
    page = 1,
    pageSize = 20,
  ): Promise<Paginated<AuditLogEntry>> {
    const supabase = requireSupabase();
    let query = supabase
      .from("audit_log")
      .select(SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.search) {
      const q = `%${filters.search}%`;
      query = query.or(
        `action.ilike.${q},entity.ilike.${q},actor_name.ilike.${q}`,
      );
    }
    if (filters.action && filters.action !== "all") {
      query = query.eq("action", filters.action);
    }
    if (filters.entity && filters.entity !== "all") {
      query = query.eq("entity", filters.entity);
    }
    if (filters.actorId && filters.actorId !== "all") {
      query = query.eq("actor_id", filters.actorId);
    }
    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte("created_at", filters.dateTo + "T23:59:59Z");
    }

    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data as unknown as DbAuditLog[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  /** Distinct values of `action` and `entity`, for filter dropdowns. */
  async facets(): Promise<{ actions: string[]; entities: string[] }> {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("audit_log")
      .select("action, entity");
    if (error) throw new Error(error.message);

    const rows = data as unknown as Array<{ action: string; entity: string }>;
    const actions = Array.from(new Set(rows.map((r) => r.action))).sort();
    const entities = Array.from(new Set(rows.map((r) => r.entity))).sort();
    return { actions, entities };
  },
};
