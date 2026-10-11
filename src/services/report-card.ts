import type { ReportCardData, ReportCardSubjectRow } from "@/types/report-card";
import { studentsService } from "./supabase/student";
import { assessmentsService } from "./supabase/assessments";
import { scoresService } from "./supabase/scores";
import { academicYearsService } from "./supabase/academic-years";
import { remarksService } from "./supabase/remarks";

const SCHOOL = {
  name: "Supreme Academy",
  address: "Accra, Ghana",
  phone: "+233 30 000 0000",
  email: "info@supreme.edu.gh",
};

export const reportCardService = {
  async buildForStudent(
    studentId: string,
    termId: string,
  ): Promise<ReportCardData | null> {
    const student = await studentsService.get(studentId);
    if (!student) return null;

    const term = await academicYearsService.getTerm(termId);
    if (!term) return null;

    const year = await academicYearsService.getYear(term.academicYearId);
    const academicYear = year?.name ?? "—";

    // Load assessments + scores + remarks in parallel
    const assessmentsRes = await assessmentsService.list(
      {
        classId: student.classId,
        termId,
        academicYear,
      },
      1,
      200,
    );

    const assessmentIds = assessmentsRes.data.map((a) => a.id);

    const [allScores, remarks] = await Promise.all([
      scoresService.listByAssessmentIds(assessmentIds),
      remarksService.get(studentId, termId),
    ]);

    // For each assessment, find this student's score
    const rows: ReportCardSubjectRow[] = assessmentsRes.data.map((a) => {
      const sc = allScores.find(
        (s) => s.assessmentId === a.id && s.studentId === studentId,
      );
      return {
        subjectId: a.subjectId,
        subjectCode: a.subjectCode,
        subjectName: a.subjectName,
        assessmentRaw: sc?.assessmentRaw ?? null,
        assessmentMax: a.maxAssessmentScore,
        examRaw: sc?.examRaw ?? null,
        examMax: a.maxExamScore,
        finalScore: sc?.finalScore ?? 0,
        grade: sc?.grade ?? "—",
        gradeLabel: sc?.gradeLabel ?? "—",
        remark: sc?.remark,
      };
    });

    // Totals
    const scored = rows.filter((r) => r.finalScore > 0);
    const totalScore = scored.reduce((sum, r) => sum + r.finalScore, 0);
    const averageScore =
      scored.length === 0
        ? 0
        : Math.round((totalScore / scored.length) * 10) / 10;

    // Class position — aggregate scores per student
    const roster = await studentsService.list(
      { classId: student.classId, status: "active" },
      1,
      200,
    );

    const studentTotals = roster.data.map((st) => {
      const total = allScores
        .filter((s) => s.studentId === st.id)
        .reduce((sum, s) => sum + s.finalScore, 0);
      return { id: st.id, total };
    });

    const sorted = [...studentTotals].sort((a, b) => b.total - a.total);
    const position =
      sorted.findIndex((s) => s.id === studentId) + 1 || sorted.length;
    const classSize = roster.total;

    return {
      student: {
        id: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        className: student.className,
        division: student.division,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
      },
      term: {
        id: term.id,
        name: term.name,
        academicYear,
        startDate: term.startDate,
        endDate: term.endDate,
      },
      subjects: rows,
      totals: {
        totalScore: Math.round(totalScore * 100) / 100,
        averageScore,
        totalSubjects: rows.length,
        position,
        classSize,
      },
      teacherRemark: remarks?.teacherRemark,
      headmasterRemark: remarks?.headmasterRemark,
      published: true,
      school: SCHOOL,
    };
  },
};
