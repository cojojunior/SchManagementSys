import type { StudentActivation } from "@/types/student-auth";

const STORAGE_KEY = "sa-student-activations";

/**
 * Simple localStorage-backed store for student login PINs.
 * Mock-only. In production this becomes a `student_credentials` table with
 * bcrypt-hashed PINs and server-side lockout enforcement.
 */
function readAll(): StudentActivation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StudentActivation[];
  } catch {
    return [];
  }
}

function writeAll(records: StudentActivation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * Mock "hash" — in production use bcrypt/argon2 server-side.
 * NOT SECURE. Only for frontend-first development.
 */
export function mockHashPin(pin: string): string {
  // Simple reversible encoding to avoid storing raw PINs in localStorage
  // during development. Do NOT use this in production.
  return btoa(`sa:${pin}:${pin.length}`);
}

export function verifyMockPin(pin: string, hash: string): boolean {
  return mockHashPin(pin) === hash;
}

export const studentAuthStore = {
  get(studentId: string): StudentActivation | null {
    return readAll().find((r) => r.studentId === studentId) ?? null;
  },

  getByAdmission(admissionNumber: string): StudentActivation | null {
    return (
      readAll().find(
        (r) =>
          r.admissionNumber.toLowerCase() === admissionNumber.toLowerCase(),
      ) ?? null
    );
  },

  upsert(record: StudentActivation): void {
    const all = readAll();
    const idx = all.findIndex((r) => r.studentId === record.studentId);
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    writeAll(all);
  },

  remove(studentId: string): void {
    writeAll(readAll().filter((r) => r.studentId !== studentId));
  },

  listAll(): StudentActivation[] {
    return readAll();
  },
};
