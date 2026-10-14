import type { UUID, Division } from "./common";

export type ScratchCardStatus =
  "unused" | "partially_used" | "exhausted" | "invalidated";

export type ScratchCard = {
  id: UUID;
  /** Public identifier, e.g. "SC-A7K3-9P2M" */
  serialNumber: string;
  /** bcrypt hash of the PIN, used for redemption */
  pinHash: string;
  /** The plaintext 4-digit PIN. Visible to Super Admin + Secretary only. */
  pinPlain?: string;
  /** Display fallback when the caller can't see the plain PIN */
  maskedPin: string;
  division: Division;
  termId: UUID;
  termName: string;
  academicYear: string;
  price: number;
  status: ScratchCardStatus;
  usesRemaining: number;
  issuedToStudentId?: UUID;
  issuedToStudentName?: string;
  issuedAt?: string;
  /** UUID of the profile that issued the card */
  issuedBy?: string;
  /** Display name of the person who issued the card */
  issuedByName?: string;
  invalidatedAt?: string;
  invalidatedReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type ScratchCardUsage = {
  id: UUID;
  cardId: UUID;
  serialNumber: string;
  studentId: UUID;
  studentName: string;
  termId: UUID;
  termName: string;
  accessedAt: string;
};

export type ScratchCardFormValues = {
  division: Division;
  termId: UUID;
  academicYear: string;
  quantity: number;
  priceOverride?: number;
};

export type ScratchCardFilters = {
  search?: string;
  division?: Division | "all";
  status?: ScratchCardStatus | "all";
  termId?: UUID | "all";
};

export type ScratchCardIssueValues = {
  cardId: UUID;
  studentId: UUID;
};

/** Default prices per division (editable by Super Admin in Settings). */
export const SCRATCH_CARD_PRICES: Record<Division, number> = {
  nursery: 10,
  kg: 10,
  primary: 15,
  jhs: 20,
};
