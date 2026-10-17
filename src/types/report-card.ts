import type { UUID } from "./common";

export type ProficiencyRating =
  "Needs Improvement" | "Satisfactory" | "Good" | "Very Good" | "Excellent";

export type ProficiencyArea =
  "Conduct" | "Work" | "Participation" | "Academic" | "Overall Performance";

export type ReportCardProficiencyRow = {
  area: ProficiencyArea;
  rating: ProficiencyRating | null;
};

export type ReportCardSubjectRow = {
  subjectId: UUID;
  subjectCode: string;
  subjectName: string;
  assessmentRaw: number | null;
  assessmentMax: number;
  examRaw: number | null;
  examMax: number;
  finalScore: number;
  grade: string;
  gradeLabel: string;
  remark?: string; // teacher's subject remark
  position?: number; // position in the class for this subject

  // Mockup columns — populated per-term when available, otherwise 0
  term1Score?: number | null;
  term2Score?: number | null;
  term3Score?: number | null;
};

export type ReportCardData = {
  student: {
    id: UUID;
    fullName: string;
    admissionNumber: string;
    className: string;
    division: string;
    gender: string;
    dateOfBirth: string;
  };
  term: {
    id: UUID;
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
  };
  subjects: ReportCardSubjectRow[];
  totals: {
    totalScore: number;
    averageScore: number;
    totalSubjects: number;
    position: number;
    classSize: number;
    classAverage?: number;
  };
  
  attendance?: {
    present: number;
    total: number;
  };
  teacherRemark?: string; // class teacher's overall remark
  headmasterRemark?: string; // Headmaster's remark
  published: boolean;
  school: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };

  // Mockup-specific, optional so nothing existing breaks
  classTeacherName?: string;
  proficiency?: ReportCardProficiencyRow[];
};
