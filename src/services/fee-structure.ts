import type {
  FeeStructure,
  FeeStructureFilters,
  FeeStructureFormValues,
} from "@/types/finance";
import type { Paginated } from "@/types/common";
import { MOCK_FEE_STRUCTURES } from "./mock/fee-structure";
import { classesService } from "./classes";
import { academicYearsService } from "./academic-years";
import type { Division } from "@/types/common";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let store: FeeStructure[] = [...MOCK_FEE_STRUCTURES];

function computeTotal(items: FeeStructure["items"]): number {
  return items.reduce((sum, i) => sum + (i.amount || 0), 0);
}

function matches(s: FeeStructure, f: FeeStructureFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay = `${s.name} ${s.termName} ${s.className ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.division && f.division !== "all" && s.division !== f.division)
    return false;
  if (f.termId && f.termId !== "all" && s.termId !== f.termId) return false;
  if (f.status && f.status !== "all" && s.status !== f.status) return false;
  return true;
}

async function enrich(values: FeeStructureFormValues): Promise<{
  className?: string;
  termName: string;
}> {
  const [cls, term] = await Promise.all([
    values.classId ? classesService.get(values.classId) : Promise.resolve(null),
    academicYearsService.getTerm(values.termId),
  ]);
  return {
    className: cls?.name,
    termName: term?.name ?? "Unknown",
  };
}

export const feeStructuresService = {
  async list(
    filters: FeeStructureFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<FeeStructure>> {
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

  async get(id: string): Promise<FeeStructure | null> {
    await delay(150);
    return store.find((s) => s.id === id) ?? null;
  },

  /**
   * Find the fee structure that applies to a given (division, term, academic year),
   * preferring a class-specific one if it exists.
   */
  async findForStudent(
    division: Division,
    classId: string | undefined,
    termId: string,
    academicYear: string,
  ): Promise<FeeStructure | null> {
    await delay(150);

    // Class-specific match first
    if (classId) {
      const specific = store.find(
        (s) =>
          s.status === "active" &&
          s.classId === classId &&
          s.termId === termId &&
          s.academicYear === academicYear,
      );
      if (specific) return specific;
    }

    // Division-wide match
    return (
      store.find(
        (s) =>
          s.status === "active" &&
          !s.classId &&
          s.division === division &&
          s.termId === termId &&
          s.academicYear === academicYear,
      ) ?? null
    );
  },

  async create(values: FeeStructureFormValues): Promise<FeeStructure> {
    await delay();
    const id = `fs-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const meta = await enrich(values);
    const items = values.items.map((i, idx) => ({
      ...i,
      id: `fi-${Date.now()}-${idx}`,
    }));
    const created: FeeStructure = {
      ...values,
      ...meta,
      id,
      items,
      total: computeTotal(items),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store = [created, ...store];
    return created;
  },

  async update(
    id: string,
    values: FeeStructureFormValues,
  ): Promise<FeeStructure> {
    await delay();
    const idx = store.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error("Fee structure not found");
    const meta = await enrich(values);
    const items = values.items.map((i, iIdx) => ({
      ...i,
      id: `fi-${Date.now()}-${iIdx}`,
    }));
    const updated: FeeStructure = {
      ...store[idx],
      ...values,
      ...meta,
      items,
      total: computeTotal(items),
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
