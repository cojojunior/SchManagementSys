import type { Remark } from "@/types/remark";
import { MOCK_REMARKS } from "./mock/remarks";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let store: Remark[] = [...MOCK_REMARKS];

export const remarksService = {
  async get(studentId: string, termId: string): Promise<Remark | null> {
    await delay(100);
    return (
      store.find((r) => r.studentId === studentId && r.termId === termId) ??
      null
    );
  },

  async listByTerm(termId: string): Promise<Remark[]> {
    await delay();
    return store.filter((r) => r.termId === termId);
  },

  /**
   * Upsert the teacher's remark for a student in a term.
   */
  async setTeacherRemark(
    studentId: string,
    termId: string,
    academicYear: string,
    remark: string,
    teacherId: string | undefined,
    teacherName: string,
  ): Promise<Remark> {
    await delay();
    const idx = store.findIndex(
      (r) => r.studentId === studentId && r.termId === termId,
    );
    const nowIso = new Date().toISOString();

    if (idx < 0) {
      const created: Remark = {
        id: `rm-${Date.now()}`,
        studentId,
        termId,
        academicYear,
        teacherRemark: remark,
        teacherId,
        teacherName,
        teacherRemarkUpdatedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store = [created, ...store];
      return created;
    }

    const updated: Remark = {
      ...store[idx],
      teacherRemark: remark,
      teacherId,
      teacherName,
      teacherRemarkUpdatedAt: nowIso,
      updatedAt: nowIso,
    };
    store[idx] = updated;
    return updated;
  },

  /**
   * Upsert the Headmaster's remark for a student in a term.
   */
  async setHeadmasterRemark(
    studentId: string,
    termId: string,
    academicYear: string,
    remark: string,
    headmasterName: string,
  ): Promise<Remark> {
    await delay();
    const idx = store.findIndex(
      (r) => r.studentId === studentId && r.termId === termId,
    );
    const nowIso = new Date().toISOString();

    if (idx < 0) {
      const created: Remark = {
        id: `rm-${Date.now()}`,
        studentId,
        termId,
        academicYear,
        headmasterRemark: remark,
        headmasterName,
        headmasterRemarkUpdatedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      store = [created, ...store];
      return created;
    }

    const updated: Remark = {
      ...store[idx],
      headmasterRemark: remark,
      headmasterName,
      headmasterRemarkUpdatedAt: nowIso,
      updatedAt: nowIso,
    };
    store[idx] = updated;
    return updated;
  },

  async remove(studentId: string, termId: string): Promise<void> {
    await delay();
    store = store.filter(
      (r) => !(r.studentId === studentId && r.termId === termId),
    );
  },
};
