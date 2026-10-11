import type {
  AcademicYear,
  AcademicYearFormValues,
  AcademicTerm,
  AcademicTermFormValues,
} from "@/types/academic-year";
import {
  MOCK_ACADEMIC_YEARS,
  MOCK_ACADEMIC_TERMS,
} from "./mock/academic-years";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let years: AcademicYear[] = [...MOCK_ACADEMIC_YEARS];
let terms: AcademicTerm[] = [...MOCK_ACADEMIC_TERMS];

export const academicYearsService = {
  // ---------- Years ----------
  async listYears(): Promise<AcademicYear[]> {
    await delay();
    return [...years].sort((a, b) => b.name.localeCompare(a.name));
  },

  async getYear(id: string): Promise<AcademicYear | null> {
    await delay(100);
    return years.find((y) => y.id === id) ?? null;
  },

  async getCurrentYear(): Promise<AcademicYear | null> {
    await delay(100);
    return years.find((y) => y.isCurrent) ?? null;
  },

  async createYear(values: AcademicYearFormValues): Promise<AcademicYear> {
    await delay();
    const id = `ay-${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (values.isCurrent) {
      years = years.map((y) => ({ ...y, isCurrent: false }));
    }

    const created: AcademicYear = {
      ...values,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    years = [created, ...years];
    return created;
  },

  async updateYear(
    id: string,
    values: AcademicYearFormValues,
  ): Promise<AcademicYear> {
    await delay();
    const idx = years.findIndex((y) => y.id === id);
    if (idx < 0) throw new Error("Academic year not found");

    if (values.isCurrent) {
      years = years.map((y) => ({ ...y, isCurrent: y.id === id }));
    }

    const updated: AcademicYear = {
      ...years[idx],
      ...values,
      updatedAt: new Date().toISOString(),
    };
    years[idx] = updated;
    return updated;
  },

  async setCurrentYear(id: string): Promise<void> {
    await delay();
    years = years.map((y) => ({ ...y, isCurrent: y.id === id }));
  },

  async removeYear(id: string): Promise<void> {
    await delay();
    years = years.filter((y) => y.id !== id);
    terms = terms.filter((t) => t.academicYearId !== id);
  },

  // ---------- Terms ----------
  async listTerms(academicYearId?: string): Promise<AcademicTerm[]> {
    await delay();
    const filtered = academicYearId
      ? terms.filter((t) => t.academicYearId === academicYearId)
      : terms;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getTerm(id: string): Promise<AcademicTerm | null> {
    await delay(100);
    return terms.find((t) => t.id === id) ?? null;
  },

  async getCurrentTerm(): Promise<AcademicTerm | null> {
    await delay(100);
    return terms.find((t) => t.isCurrent) ?? null;
  },

  async createTerm(values: AcademicTermFormValues): Promise<AcademicTerm> {
    await delay();
    const id = `t-${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (values.isCurrent) {
      terms = terms.map((t) => ({ ...t, isCurrent: false }));
    }

    const created: AcademicTerm = {
      ...values,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    terms = [...terms, created];
    return created;
  },

  async updateTerm(
    id: string,
    values: AcademicTermFormValues,
  ): Promise<AcademicTerm> {
    await delay();
    const idx = terms.findIndex((t) => t.id === id);
    if (idx < 0) throw new Error("Term not found");

    if (values.isCurrent) {
      terms = terms.map((t) => ({ ...t, isCurrent: t.id === id }));
    }

    const updated: AcademicTerm = {
      ...terms[idx],
      ...values,
      updatedAt: new Date().toISOString(),
    };
    terms[idx] = updated;
    return updated;
  },

  async setCurrentTerm(id: string): Promise<void> {
    await delay();
    terms = terms.map((t) => ({ ...t, isCurrent: t.id === id }));
  },

  async removeTerm(id: string): Promise<void> {
    await delay();
    terms = terms.filter((t) => t.id !== id);
  },
};
