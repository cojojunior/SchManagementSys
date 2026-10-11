import type { SchoolClass, ClassFilters, ClassFormValues } from "@/types/class";
import type { Paginated } from "@/types/common";
import { MOCK_CLASSES } from "./mock/classes";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let store: SchoolClass[] = [...MOCK_CLASSES];

function matches(c: SchoolClass, f: ClassFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay = `${c.name} ${c.classTeacherName ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.division && f.division !== "all" && c.division !== f.division)
    return false;
  if (f.status && f.status !== "all" && c.status !== f.status) return false;
  if (
    f.academicYear &&
    f.academicYear !== "all" &&
    c.academicYear !== f.academicYear
  )
    return false;
  return true;
}

export const classesService = {
  async list(
    filters: ClassFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<SchoolClass>> {
    await delay();
    const filtered = store.filter((c) => matches(c, filters));
    const start = (page - 1) * pageSize;
    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<SchoolClass | null> {
    await delay(150);
    return store.find((c) => c.id === id) ?? null;
  },

  async create(values: ClassFormValues): Promise<SchoolClass> {
    await delay();
    const id = `cls-${Date.now()}`;
    const now = new Date().toISOString();
    const created: SchoolClass = {
      ...values,
      id,
      studentCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    store = [created, ...store];
    return created;
  },

  async update(id: string, values: ClassFormValues): Promise<SchoolClass> {
    await delay();
    const idx = store.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Class not found");
    const updated: SchoolClass = {
      ...store[idx],
      ...values,
      updatedAt: new Date().toISOString(),
    };
    store[idx] = updated;
    return updated;
  },

  async remove(id: string): Promise<void> {
    await delay();
    store = store.filter((c) => c.id !== id);
  },
};
