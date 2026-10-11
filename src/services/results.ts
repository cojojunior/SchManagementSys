import type {
  AssessmentResult,
  ResultChangeLog,
  ResultFilters,
  ResultStatus,
} from "@/types/result";
import type { Paginated } from "@/types/common";
import { assessmentsService } from "./assessments";
import { scoresService } from "./scores";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// In-memory change log so we can display "history" for a result.
let log: ResultChangeLog[] = [];

async function toResult(
  assessmentId: string,
): Promise<AssessmentResult | null> {
  const asm = await assessmentsService.get(assessmentId);
  if (!asm) return null;
  const scores = await scoresService.listByAssessment(assessmentId);

  const finals = scores.map((s) => s.finalScore).filter((n) => n > 0);
  const avg =
    finals.length === 0
      ? 0
      : Math.round((finals.reduce((a, b) => a + b, 0) / finals.length) * 10) /
        10;
  const highest = finals.length ? Math.max(...finals) : 0;
  const lowest = finals.length ? Math.min(...finals) : 0;

  // Map ScoreStatus → ResultStatus (identical strings, but strongly typed)
  const status: ResultStatus =
    asm.status === "closed"
      ? "published"
      : ((scores[0]?.status as ResultStatus) ?? "draft");

  return {
    assessmentId: asm.id,
    classId: asm.classId,
    className: asm.className,
    subjectId: asm.subjectId,
    subjectName: asm.subjectName,
    subjectCode: asm.subjectCode,
    academicYear: asm.academicYear,
    termId: asm.termId,
    termName: asm.termName,
    teacherId: asm.teacherId,
    teacherName: asm.teacherName,
    status,
    studentCount: scores.length,
    classAverage: avg,
    highest,
    lowest,
  };
}

export const resultsService = {
  async list(
    filters: ResultFilters = {},
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<AssessmentResult>> {
    await delay();
    const assessments = await assessmentsService.list({}, 1, 500);

    const results: AssessmentResult[] = [];
    for (const a of assessments.data) {
      const r = await toResult(a.id);
      if (!r) continue;
      if (
        filters.status &&
        filters.status !== "all" &&
        r.status !== filters.status
      )
        continue;
      if (
        filters.classId &&
        filters.classId !== "all" &&
        r.classId !== filters.classId
      )
        continue;
      if (
        filters.subjectId &&
        filters.subjectId !== "all" &&
        r.subjectId !== filters.subjectId
      )
        continue;
      if (
        filters.termId &&
        filters.termId !== "all" &&
        r.termId !== filters.termId
      )
        continue;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay =
          `${r.className} ${r.subjectName} ${r.termName} ${r.teacherName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      results.push(r);
    }

    const start = (page - 1) * pageSize;
    return {
      data: results.slice(start, start + pageSize),
      total: results.length,
      page,
      pageSize,
    };
  },

  async get(assessmentId: string): Promise<AssessmentResult | null> {
    await delay(150);
    return toResult(assessmentId);
  },

  async submitForReview(assessmentId: string, actor: string): Promise<void> {
    await delay();
    await scoresService.updateStatus(assessmentId, "submitted");
    log = [
      {
        id: `log-${Date.now()}`,
        assessmentId,
        actorName: actor,
        action: "submitted",
        createdAt: new Date().toISOString(),
      },
      ...log,
    ];
  },

  async returnForCorrection(
    assessmentId: string,
    actor: string,
    reason: string,
  ) {
    await delay();
    await scoresService.updateStatus(assessmentId, "draft");
    log = [
      {
        id: `log-${Date.now()}`,
        assessmentId,
        actorName: actor,
        action: "returned",
        reason,
        createdAt: new Date().toISOString(),
      },
      ...log,
    ];
  },

  async approve(assessmentId: string, actor: string): Promise<void> {
    await delay();
    await scoresService.updateStatus(assessmentId, "approved");
    log = [
      {
        id: `log-${Date.now()}`,
        assessmentId,
        actorName: actor,
        action: "approved",
        createdAt: new Date().toISOString(),
      },
      ...log,
    ];
  },

  async publish(assessmentId: string, actor: string): Promise<void> {
    await delay();
    await scoresService.updateStatus(assessmentId, "published");
    log = [
      {
        id: `log-${Date.now()}`,
        assessmentId,
        actorName: actor,
        action: "published",
        createdAt: new Date().toISOString(),
      },
      ...log,
    ];
  },

  async lock(assessmentId: string, actor: string): Promise<void> {
    await delay();
    await scoresService.updateStatus(assessmentId, "published"); // locked = terminal
    log = [
      {
        id: `log-${Date.now()}`,
        assessmentId,
        actorName: actor,
        action: "locked",
        createdAt: new Date().toISOString(),
      },
      ...log,
    ];
  },

  async changeLog(assessmentId: string): Promise<ResultChangeLog[]> {
    await delay(100);
    return log.filter((l) => l.assessmentId === assessmentId);
  },
};
