import type {
  Score,
  MarkEntryRow,
  SaveScoresPayload,
  ScoreStatus,
} from "@/types/score";
import { MOCK_SCORES } from "./mock/scores";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

let store: Score[] = [...MOCK_SCORES];

export const scoresService = {
  /** Get all scores for one assessment (may be empty). */
  async listByAssessment(assessmentId: string): Promise<Score[]> {
    await delay();
    return store.filter((s) => s.assessmentId === assessmentId);
  },

  /** Bulk save — upserts rows, replacing the assessment's existing set. */
  async saveScores(payload: SaveScoresPayload): Promise<Score[]> {
    await delay(350);
    const nowIso = new Date().toISOString();

    // Remove existing scores for this assessment, then insert the new set
    store = store.filter((s) => s.assessmentId !== payload.assessmentId);

    const rows: Score[] = payload.rows.map((r, i) => ({
      id: `sc-${Date.now()}-${i}`,
      assessmentId: payload.assessmentId,
      studentId: r.studentId,
      studentName: r.studentName,
      admissionNumber: r.admissionNumber,
      assessmentRaw: r.assessmentRaw,
      examRaw: r.examRaw,
      assessmentWeighted: r.assessmentWeighted,
      examWeighted: r.examWeighted,
      finalScore: r.finalScore,
      grade: r.grade,
      gradeLabel: r.gradeLabel,
      remark: r.remark,
      status: "draft",
      updatedAt: nowIso,
    }));

    store = [...store, ...rows];
    return rows;
  },

  /** Update status of all scores for an assessment. */
  async updateStatus(assessmentId: string, status: ScoreStatus): Promise<void> {
    await delay(200);
    store = store.map((s) =>
      s.assessmentId === assessmentId
        ? { ...s, status, updatedAt: new Date().toISOString() }
        : s,
    );
  },

  /** Convenience: get a single score. */
  async get(id: string): Promise<Score | null> {
    await delay(100);
    return store.find((s) => s.id === id) ?? null;
  },

  /** Update a single score after Headmaster review (edits with audit). */
  async updateScore(
    scoreId: string,
    patch: Partial<
      Pick<Score, "assessmentRaw" | "examRaw" | "remark" | "grade">
    >,
  ): Promise<Score | null> {
    await delay();
    const idx = store.findIndex((s) => s.id === scoreId);
    if (idx < 0) return null;
    const updated: Score = {
      ...store[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    store[idx] = updated;
    return updated;
  },

  /** Get every score for a set of assessment ids (used for term-wide report assembly). */
  async listByAssessmentIds(assessmentIds: string[]): Promise<Score[]> {
    await delay();
    const set = new Set(assessmentIds);
    return store.filter((s) => set.has(s.assessmentId));
  },
};

export type { MarkEntryRow };
