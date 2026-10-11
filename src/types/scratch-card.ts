import type { UUID, Division } from "./common";

export type ScratchCardStatus =
  "unused" | "partially_used" | "exhausted" | "invalidated";

export type ScratchCard = {
  id: UUID;
  serialNumber: string;
  pinHash: string;
  maskedPin: string;
  /**
   * Mock-only field. In production the raw PIN is NEVER stored — only its hash.
   * Remove this field when we wire Supabase.
   */
  rawPinForMock?: string;
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
  issuedBy?: string;
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
  ipAddress?: string;
  userAgent?: string;
};

export type ScratchCardFormValues = {
  division: Division;
  termId: UUID;
  academicYear: string;
  quantity: number; // how many cards to generate at once
  priceOverride?: number; // optional — default from division
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

// Default prices per division (configurable by Super Admin in a future Settings module)
export const SCRATCH_CARD_PRICES: Record<Division, number> = {
  nursery: 10,
  kg: 10,
  primary: 15,
  jhs: 20,
};
