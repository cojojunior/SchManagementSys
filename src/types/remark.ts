import type { UUID } from "./common";

export type Remark = {
  id: UUID;
  studentId: UUID;
  termId: UUID;
  academicYear: string;

  // Teacher's remark
  teacherRemark?: string;
  teacherId?: UUID;
  teacherName?: string;
  teacherRemarkUpdatedAt?: string;

  // Headmaster's remark
  headmasterRemark?: string;
  headmasterName?: string;
  headmasterRemarkUpdatedAt?: string;

  createdAt: string;
  updatedAt: string;
};

export type RemarkFormValues = {
  teacherRemark?: string;
  headmasterRemark?: string;
};
