import type {
  Subject,
  SubjectFilters,
  SubjectFormValues,
} from "@/types/subjects";
import type { Paginated } from "@/types/common";
import { MOCK_SUBJECTS } from "./mock/subjects";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let store: Subject[] = [...MOCK_SUBJECTS];

function matches(s: Subject, f: SubjectFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay = `${s.name} ${s.code}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.division && f.division !== "all" && !s.divisions.includes(f.division)) {
    return false;
  }
  if (f.status && f.status !== "all" && s.status !== f.status) return false;
  return true;
}

export const subjectsService = {
  async list(
    filters: SubjectFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Subject>> {
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

  async get(id: string): Promise<Subject | null> {
    await delay(150);
    return store.find((s) => s.id === id) ?? null;
  },

  async create(values: SubjectFormValues): Promise<Subject> {
    await delay();
    const id = `sub-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const created: Subject = {
      ...values,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store = [created, ...store];
    return created;
  },

  async update(id: string, values: SubjectFormValues): Promise<Subject> {
    await delay();
    const idx = store.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error("Subject not found");
    const updated: Subject = {
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
