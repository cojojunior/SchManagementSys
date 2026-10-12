import type { UUID } from "./common";

export type AuditLogEntry = {
  id: UUID;
  actorId?: UUID;
  actorName?: string;
  action: string;
  entity: string;
  entityId?: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
};

export type AuditLogFilters = {
  search?: string;
  action?: string | "all";
  entity?: string | "all";
  actorId?: UUID | "all";
  dateFrom?: string;
  dateTo?: string;
};
