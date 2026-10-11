import type {
  ScratchCard,
  ScratchCardFilters,
  ScratchCardFormValues,
  ScratchCardUsage,
  ScratchCardStatus,
} from "@/types/scratch-card";
import { SCRATCH_CARD_PRICES } from "@/types/scratch-card";
import type { Paginated } from "@/types/common";
import {
  MOCK_SCRATCH_CARDS,
  MOCK_SCRATCH_CARD_USAGES,
} from "./mock/scratch-cards";
import { academicYearsService } from "./academic-years";
import { studentsService } from "./students";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let cards: ScratchCard[] = [...MOCK_SCRATCH_CARDS];
let usages: ScratchCardUsage[] = [...MOCK_SCRATCH_CARD_USAGES];

/** Generate an unpredictable 8-digit PIN. In production this must be hashed with bcrypt or argon2 server-side. */
function generatePin(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function generateSerial(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SC-${new Date().getFullYear()}-${s}`;
}

function computeStatus(card: ScratchCard): ScratchCardStatus {
  if (card.invalidatedAt) return "invalidated";
  if (card.usesRemaining <= 0) return "exhausted";
  if (card.usesRemaining < 3) return "partially_used";
  return "unused";
}

function matches(c: ScratchCard, f: ScratchCardFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay =
      `${c.serialNumber} ${c.issuedToStudentName ?? ""} ${c.termName}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.division && f.division !== "all" && c.division !== f.division)
    return false;
  if (f.status && f.status !== "all" && c.status !== f.status) return false;
  if (f.termId && f.termId !== "all" && c.termId !== f.termId) return false;
  return true;
}

export const scratchCardsService = {
  async list(
    filters: ScratchCardFilters = {},
    page = 1,
    pageSize = 20,
  ): Promise<Paginated<ScratchCard>> {
    await delay();
    // Refresh statuses before filtering
    const refreshed = cards.map((c) => ({ ...c, status: computeStatus(c) }));
    const filtered = refreshed.filter((c) => matches(c, filters));
    const start = (page - 1) * pageSize;
    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<ScratchCard | null> {
    await delay(150);
    const c = cards.find((x) => x.id === id);
    return c ? { ...c, status: computeStatus(c) } : null;
  },

  /**
   * Generate N cards at once for a division+term.
   * Returns the generated cards, including their raw PINs (which must be shown to the operator ONCE).
   */
  async generate(
    values: ScratchCardFormValues,
  ): Promise<Array<ScratchCard & { rawPin: string }>> {
    await delay(500);

    const term = await academicYearsService.getTerm(values.termId);
    if (!term) throw new Error("Term not found");

    const quantity = Math.max(1, Math.min(200, values.quantity));
    const price = values.priceOverride ?? SCRATCH_CARD_PRICES[values.division];

    const nowIso = new Date().toISOString();
    const created: Array<ScratchCard & { rawPin: string }> = [];

    for (let i = 0; i < quantity; i++) {
      const rawPin = generatePin();
      const card: ScratchCard = {
        id: `sc-${Date.now()}-${i}`,
        serialNumber: generateSerial(),
        pinHash: `mock-hash-${Date.now()}-${i}`, // in prod: real hash
        maskedPin: "••••",
        division: values.division,
        termId: values.termId,
        termName: term.name,
        academicYear: values.academicYear,
        price,
        status: "unused",
        usesRemaining: 3,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      created.push({ ...card, rawPin });
      cards = [card, ...cards];
    }

    return created;
  },

  /** Issue a card to a specific student. */
  async issue(
    cardId: string,
    studentId: string,
    issuedBy: string,
  ): Promise<ScratchCard> {
    await delay();
    const idx = cards.findIndex((c) => c.id === cardId);
    if (idx < 0) throw new Error("Card not found");
    const student = await studentsService.get(studentId);
    if (!student) throw new Error("Student not found");

    const updated: ScratchCard = {
      ...cards[idx],
      issuedToStudentId: studentId,
      issuedToStudentName: `${student.firstName} ${student.lastName}`,
      issuedAt: new Date().toISOString(),
      issuedBy,
      updatedAt: new Date().toISOString(),
    };
    cards[idx] = updated;
    return { ...updated, status: computeStatus(updated) };
  },

  /** Invalidate a card (e.g. damaged, lost, or fraud-suspected). */
  async invalidate(cardId: string, reason: string): Promise<ScratchCard> {
    await delay();
    const idx = cards.findIndex((c) => c.id === cardId);
    if (idx < 0) throw new Error("Card not found");
    const updated: ScratchCard = {
      ...cards[idx],
      invalidatedAt: new Date().toISOString(),
      invalidatedReason: reason,
      updatedAt: new Date().toISOString(),
    };
    cards[idx] = updated;
    return { ...updated, status: computeStatus(updated) };
  },

  async remove(id: string): Promise<void> {
    await delay();
    cards = cards.filter((c) => c.id !== id);
  },

  /** Usage history for a card. */
  async listUsages(cardId: string): Promise<ScratchCardUsage[]> {
    await delay(150);
    return usages
      .filter((u) => u.cardId === cardId)
      .sort((a, b) => (a.accessedAt < b.accessedAt ? 1 : -1));
  },

  /** All usages (for the usage log page). */
  async listAllUsages(): Promise<ScratchCardUsage[]> {
    await delay();
    return [...usages].sort((a, b) => (a.accessedAt < b.accessedAt ? 1 : -1));
  },

  /**
   * Redeem a card — server-side atomic operation in production.
   * Mock version: consumes 1 use if valid; returns remaining uses.
   * Never exposes the raw PIN in logs.
   */
 async redeem(
  studentId: string,
  termId: string,
): Promise<{
  ok: boolean;
  usesRemaining?: number;
  reason?: string;
}> {
  await delay(300);
  // In production this must be a SECURITY DEFINER Postgres function with row locking.
  // Here we match against unused / partially-used cards for the given student + term.
  const candidate = cards.find(
    (c) =>
      c.termId === termId &&
      !c.invalidatedAt &&
      c.usesRemaining > 0 &&
      (c.issuedToStudentId === studentId || !c.issuedToStudentId),
  );
  if (!candidate) {
    return { ok: false, reason: "Invalid or exhausted card" };
  }

  const idx = cards.findIndex((c) => c.id === candidate.id);
  const updated: ScratchCard = {
    ...cards[idx],
    usesRemaining: cards[idx].usesRemaining - 1,
    updatedAt: new Date().toISOString(),
  };
  cards[idx] = updated;

  const student = await studentsService.get(studentId);
  usages = [
    {
      id: `scu-${Date.now()}`,
      cardId: candidate.id,
      serialNumber: candidate.serialNumber,
      studentId,
      studentName: student
        ? `${student.firstName} ${student.lastName}`
        : "Unknown",
      termId,
      termName: candidate.termName,
      accessedAt: new Date().toISOString(),
    },
    ...usages,
  ];

  return { ok: true, usesRemaining: updated.usesRemaining };
},
};
