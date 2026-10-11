import type {
  Assessment,
  AssessmentFilters,
  AssessmentFormValues,
} from "@/types/assessment";
import type { Paginated } from "@/types/common";
import { MOCK_ASSESSMENTS } from "./mock/assessments";
import { classesService } from "./classes";
import { subjectsService } from "./subjects";
import { academicYearsService } from "./academic-years";
import { staffService } from "./staff";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let store: Assessment[] = [...MOCK_ASSESSMENTS];

function matches(a: Assessment, f: AssessmentFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay =
      `${a.className} ${a.subjectName} ${a.subjectCode} ${a.termName} ${a.teacherName ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.classId && f.classId !== "all" && a.classId !== f.classId) return false;
  if (f.subjectId && f.subjectId !== "all" && a.subjectId !== f.subjectId)
    return false;
  if (f.termId && f.termId !== "all" && a.termId !== f.termId) return false;
  if (
    f.academicYear &&
    f.academicYear !== "all" &&
    a.academicYear !== f.academicYear
  )
    return false;
  if (f.status && f.status !== "all" && a.status !== f.status) return false;
  return true;
}

async function enrich(values: AssessmentFormValues): Promise<{
  className: string;
  subjectName: string;
  subjectCode: string;
  termName: string;
  teacherName?: string;
}> {
  const [cls, subj, term, staff] = await Promise.all([
    classesService.get(values.classId),
    subjectsService.get(values.subjectId),
    academicYearsService.getTerm(values.termId),
    values.teacherId
      ? staffService.get(values.teacherId)
      : Promise.resolve(null),
  ]);
  return {
    className: cls?.name ?? "Unknown",
    subjectName: subj?.name ?? "Unknown",
    subjectCode: subj?.code ?? "—",
    termName: term?.name ?? "Unknown",
    teacherName: staff ? `${staff.firstName} ${staff.lastName}` : undefined,
  };
}

export const assessmentsService = {
  async list(
    filters: AssessmentFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Assessment>> {
    await delay();
    const filtered = store.filter((a) => matches(a, filters));
    const start = (page - 1) * pageSize;
    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Assessment | null> {
    await delay(150);
    return store.find((a) => a.id === id) ?? null;
  },

  async create(values: AssessmentFormValues): Promise<Assessment> {
    await delay();
    const id = `asm-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Prevent duplicates: same class + subject + term + academic year
    const duplicate = store.find(
      (a) =>
        a.classId === values.classId &&
        a.subjectId === values.subjectId &&
        a.termId === values.termId &&
        a.academicYear === values.academicYear,
    );
    if (duplicate) {
      throw new Error(
        "An assessment already exists for this class, subject, term, and academic year.",
      );
    }

    const meta = await enrich(values);
    const created: Assessment = {
      ...values,
      ...meta,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store = [created, ...store];
    return created;
  },

  async update(id: string, values: AssessmentFormValues): Promise<Assessment> {
    await delay();
    const idx = store.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error("Assessment not found");
    const meta = await enrich(values);
    const updated: Assessment = {
      ...store[idx],
      ...values,
      ...meta,
      updatedAt: new Date().toISOString(),
    };
    store[idx] = updated;
    return updated;
  },

  async remove(id: string): Promise<void> {
    await delay();
    store = store.filter((a) => a.id !== id);
  },
};
