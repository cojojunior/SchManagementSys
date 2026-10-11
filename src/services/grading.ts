import type { GradingScale, GradingScaleFormValues } from "@/types/grading";
import { MOCK_GRADING_SCALES } from "./mock/grading";
import type { Division } from "@/types/common";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let store: GradingScale[] = [...MOCK_GRADING_SCALES];

export const gradingService = {
  async list(): Promise<GradingScale[]> {
    await delay();
    return [...store];
  },

  async get(id: string): Promise<GradingScale | null> {
    await delay(100);
    return store.find((s) => s.id === id) ?? null;
  },

  /**
   * Find the scale that applies to a given division.
   * If multiple scales apply, the first active one is returned.
   */
  async getForDivision(division: Division): Promise<GradingScale | null> {
    await delay(100);
    return (
      store.find((s) => s.isActive && s.divisions.includes(division)) ?? null
    );
  },

  async create(values: GradingScaleFormValues): Promise<GradingScale> {
    await delay();
    const id = `gs-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const created: GradingScale = {
      ...values,
      id,
      bands: values.bands.map((b, i) => ({
        ...b,
        id: `gb-${Date.now()}-${i}`,
        scaleId: id,
      })),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store = [...store, created];
    return created;
  },

  async update(
    id: string,
    values: GradingScaleFormValues,
  ): Promise<GradingScale> {
    await delay();
    const idx = store.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error("Grading scale not found");
    const updated: GradingScale = {
      ...store[idx],
      ...values,
      bands: values.bands.map((b, i) => ({
        ...b,
        id: `gb-${Date.now()}-${i}`,
        scaleId: id,
      })),
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
