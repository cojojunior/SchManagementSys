import type { Staff, StaffFilters, StaffFormValues } from "@/types/staff";
import type { Paginated } from "@/types/common";
import { MOCK_STAFF } from "./mock/staff";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let store: Staff[] = [...MOCK_STAFF];

function matches(s: Staff, f: StaffFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay =
      `${s.firstName} ${s.lastName} ${s.staffId} ${s.email} ${s.jobTitle}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.category && f.category !== "all" && s.category !== f.category)
    return false;
  if (
    f.employmentStatus &&
    f.employmentStatus !== "all" &&
    s.employmentStatus !== f.employmentStatus
  )
    return false;
  if (
    f.accountStatus &&
    f.accountStatus !== "all" &&
    s.accountStatus !== f.accountStatus
  )
    return false;
  return true;
}

export const staffService = {
  async list(
    filters: StaffFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Staff>> {
    await delay();
    const filtered = store.filter((s) => matches(s, filters));
    const start = (page - 1) * pageSize;
    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Staff | null> {
    await delay(150);
    return store.find((s) => s.id === id) ?? null;
  },

  async create(values: StaffFormValues): Promise<Staff> {
    await delay();
    const id = `stf-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const next = store.length + 1;
    const staffId = `SA-STF-${String(next).padStart(4, "0")}`;
    const created: Staff = {
      ...values,
      id,
      staffId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store = [created, ...store];
    return created;
  },

  async update(id: string, values: StaffFormValues): Promise<Staff> {
    await delay();
    const idx = store.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error("Staff not found");
    const updated: Staff = {
      ...store[idx],
      ...values,
      updatedAt: new Date().toISOString(),
    };
    store[idx] = updated;
    return updated;
  },

  async remove(id: string): Promise<void> {
    await delay();
    store = store.filter((s) => s.id !== id);
  },
};
