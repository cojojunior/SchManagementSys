import type {
  Student,
  StudentFilters,
  StudentFormValues,
} from "@/types/student";
import type { Paginated } from "@/types/common";
import { MOCK_STUDENTS } from "./mock/students";

// Simulated latency so loading states are real
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// In-memory store so create/edit/delete persist for the session
let store: Student[] = [...MOCK_STUDENTS];

function matches(s: Student, filters: StudentFilters): boolean {
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const hay =
      `${s.firstName} ${s.lastName} ${s.admissionNumber} ${s.className}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (
    filters.division &&
    filters.division !== "all" &&
    s.division !== filters.division
  )
    return false;
  if (filters.status && filters.status !== "all" && s.status !== filters.status)
    return false;
  if (
    filters.classId &&
    filters.classId !== "all" &&
    s.classId !== filters.classId
  )
    return false;
  return true;
}

export const studentsService = {
  async list(
    filters: StudentFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<Student>> {
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

  async get(id: string): Promise<Student | null> {
    await delay(150);
    return store.find((s) => s.id === id) ?? null;
  },

  async create(values: StudentFormValues): Promise<Student> {
    await delay();
    const id = `stu-${Date.now()}`;
    const now = new Date().toISOString();
    const next = store.length + 1;
    const admissionNumber = `SA-2024-${String(next).padStart(4, "0")}`;

    const created: Student = {
      ...values,
      id,
      className: "—",
      admissionNumber,
      guardian: { ...values.guardian, id: `g-${Date.now()}` },
      createdAt: now,
      updatedAt: now,
    };
    store = [created, ...store];
    return created;
  },

  async findByAdmission(admissionNumber: string): Promise<Student | null> {
    await delay(150);
    return (
      store.find(
        (s) =>
          s.admissionNumber.toLowerCase() === admissionNumber.toLowerCase(),
      ) ?? null
    );
  },
  
  async update(id: string, values: StudentFormValues): Promise<Student> {
    await delay();
    const idx = store.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error("Student not found");
    const updated: Student = {
      ...store[idx],
      ...values,
      guardian: { ...values.guardian, id: store[idx].guardian.id },
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
