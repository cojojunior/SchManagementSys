import { studentsService } from "./students";
import {
  mockHashPin,
  studentAuthStore,
  verifyMockPin,
} from "./mock/student-auth-store";
import type { Student } from "@/types/student";
import type { StudentActivation } from "@/types/student-auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export type ActivationResult =
  { ok: true; student: Student } | { ok: false; reason: string };

export type LoginResult =
  { ok: true; student: Student } | { ok: false; reason: string };

function isLocked(record: StudentActivation): boolean {
  if (!record.lockedUntil) return false;
  return new Date(record.lockedUntil) > new Date();
}

export const studentAuthService = {
  /**
   * Step 1 of activation: verify identity.
   * Requires admission number + date of birth.
   * Returns generic messages — never leaks whether a record exists.
   */
  async verifyIdentity(
    admissionNumber: string,
    dateOfBirth: string,
  ): Promise<ActivationResult> {
    const student = await studentsService.findByAdmission(admissionNumber);

    // Always take the same amount of time regardless of outcome
    await new Promise((r) => setTimeout(r, 300));

    if (!student) {
      return {
        ok: false,
        reason: "Invalid admission number or date of birth.",
      };
    }
    if (student.dateOfBirth !== dateOfBirth) {
      return {
        ok: false,
        reason: "Invalid admission number or date of birth.",
      };
    }
    if (student.status !== "active") {
      return {
        ok: false,
        reason:
          "This student account is not currently active. Please contact the school office.",
      };
    }

    return { ok: true, student };
  },

  /**
   * Step 2 of activation: set the 4-digit login PIN.
   * Mock: stores a mock hash in localStorage.
   */
  async setLoginPin(
    studentId: string,
    pin: string,
  ): Promise<{ ok: boolean; reason?: string }> {
    if (!/^\d{4}$/.test(pin)) {
      return { ok: false, reason: "PIN must be exactly 4 digits." };
    }
    if (/(\d)\1{3}/.test(pin)) {
      return { ok: false, reason: "PIN cannot be four identical digits." };
    }

    const student = await studentsService.get(studentId);
    if (!student) return { ok: false, reason: "Student not found." };

    const record: StudentActivation = {
      studentId,
      admissionNumber: student.admissionNumber,
      pinHash: mockHashPin(pin),
      activatedAt: new Date().toISOString(),
      failedAttempts: 0,
    };
    studentAuthStore.upsert(record);
    return { ok: true };
  },

  /** Check whether a student has already activated. */
  hasActivated(studentId: string): boolean {
    return studentAuthStore.get(studentId) !== null;
  },

  /**
   * Sign in with admission number + 4-digit PIN.
   * Enforces lockout after MAX_FAILED_ATTEMPTS.
   * Returns generic messages.
   */
  async login(admissionNumber: string, pin: string): Promise<LoginResult> {
    await new Promise((r) => setTimeout(r, 400));

    const student = await studentsService.findByAdmission(admissionNumber);
    const genericError = {
      ok: false as const,
      reason: "Invalid admission number or PIN.",
    };

    if (!student) return genericError;

    const record = studentAuthStore.get(student.id);
    if (!record) return genericError;

    if (isLocked(record)) {
      const minutesLeft = Math.ceil(
        (new Date(record.lockedUntil!).getTime() - Date.now()) / 60000,
      );
      return {
        ok: false,
        reason: `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
      };
    }

    if (!verifyMockPin(pin, record.pinHash)) {
      const next: StudentActivation = {
        ...record,
        failedAttempts: record.failedAttempts + 1,
      };
      if (next.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        next.lockedUntil = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000,
        ).toISOString();
        next.failedAttempts = 0;
      }
      studentAuthStore.upsert(next);
      return genericError;
    }

    // Reset on success
    studentAuthStore.upsert({
      ...record,
      failedAttempts: 0,
      lockedUntil: undefined,
    });
    return { ok: true, student };
  },

  /** Reset (admin or recovery). */
  async reset(studentId: string): Promise<void> {
    studentAuthStore.remove(studentId);
  },
};
