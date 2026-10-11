import type {
  TeachingAssignment,
  TeachingAssignmentFilters,
  TeachingAssignmentFormValues,
} from "@/types/teaching-assignment";
import type { Paginated } from "@/types/common";
import { MOCK_TEACHING_ASSIGNMENTS } from "./mock/teaching-assignments";
import { staffService } from "./staff";
import { classesService } from "./classes";
import { subjectsService } from "./subjects";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let store: TeachingAssignment[] = [...MOCK_TEACHING_ASSIGNMENTS];

function matches(a: TeachingAssignment, f: TeachingAssignmentFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay =
      `${a.staffName} ${a.className} ${a.subjectName} ${a.subjectCode}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.staffId && f.staffId !== "all" && a.staffId !== f.staffId) return false;
  if (f.classId && f.classId !== "all" && a.classId !== f.classId) return false;
  if (f.subjectId && f.subjectId !== "all" && a.subjectId !== f.subjectId)
    return false;
  if (
    f.academicYear &&
    f.academicYear !== "all" &&
    a.academicYear !== f.academicYear
  )
    return false;
  if (f.isActive === "true" && !a.isActive) return false;
  if (f.isActive === "false" && a.isActive) return false;
  return true;
}

async function enrich(values: TeachingAssignmentFormValues): Promise<{
  staffName: string;
  className: string;
  subjectName: string;
  subjectCode: string;
}> {
  const [staff, cls, subj] = await Promise.all([
    staffService.get(values.staffId),
    classesService.get(values.classId),
    subjectsService.get(values.subjectId),
  ]);
  return {
    staffName: staff ? `${staff.firstName} ${staff.lastName}` : "Unknown",
    className: cls?.name ?? "Unknown",
    subjectName: subj?.name ?? "Unknown",
    subjectCode: subj?.code ?? "—",
  };
}

export const teachingAssignmentsService = {
  async list(
    filters: TeachingAssignmentFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<TeachingAssignment>> {
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

  async get(id: string): Promise<TeachingAssignment | null> {
    await delay(150);
    return store.find((a) => a.id === id) ?? null;
  },

  async create(
    values: TeachingAssignmentFormValues,
  ): Promise<TeachingAssignment> {
    await delay();
    const id = `ta-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const meta = await enrich(values);

    // Prevent duplicate: same staff + class + subject + academic year
    const duplicate = store.find(
      (a) =>
        a.staffId === values.staffId &&
        a.classId === values.classId &&
        a.subjectId === values.subjectId &&
        a.academicYear === values.academicYear,
    );
    if (duplicate) {
      throw new Error(
        "This staff member is already assigned to teach this subject in this class for the given academic year.",
      );
    }

    const created: TeachingAssignment = {
      ...values,
      ...meta,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store = [created, ...store];
    return created;
  },

  async update(
    id: string,
    values: TeachingAssignmentFormValues,
  ): Promise<TeachingAssignment> {
    await delay();
    const idx = store.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error("Teaching assignment not found");
    const meta = await enrich(values);
    const updated: TeachingAssignment = {
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
