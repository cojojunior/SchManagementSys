export type StudentActivation = {
  studentId: string;
  admissionNumber: string;
  /** Mock-only: 4-digit PIN stored in localStorage. In production: bcrypt hash in DB. */
  pinHash: string;
  activatedAt: string;
  /** Attempt tracking — reset on successful login. */
  failedAttempts: number;
  lockedUntil?: string;
};
