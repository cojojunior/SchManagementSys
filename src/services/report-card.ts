import type {
  ReportCardData,
  ReportCardSubjectRow,
  ReportCardProficiencyRow,
  ProficiencyArea,
} from "@/types/report-card";
import { studentsService } from "./supabase/student";
import { assessmentsService } from "./supabase/assessments";
import { scoresService } from "./supabase/scores";
import { academicYearsService } from "./supabase/academic-years";
import { remarksService } from "./supabase/remarks";
import { subjectsService } from "./supabase/subjects";
import { proficiencyRatingsService } from "./supabase/proficiency-ratings";

const SCHOOL = {
  name: "Supreme Academy",
  address: "Accra, Ghana",
  phone: "+233 30 000 0000",
  email: "info@supreme.edu.gh",
};

const PROFICIENCY_AREAS: ProficiencyArea[] = [
  "Conduct",
  "Work",
  "Participation",
  "Academic",
  "Overall Performance",
];

/** Normalize "Primary" / "primary" / "PRIMARY" → "primary" for the
 *  subjects.divisions array filter. */
function normalizeDivision(
  raw: string | undefined,
): "nursery" | "kg" | "primary" | "jhs" | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === "nursery" || v === "kg" || v === "primary" || v === "jhs") {
    return v;
  }
  return null;
}

export const reportCardService = {
  async buildForStudent(
    studentId: string,
    termId: string,
  ): Promise<ReportCardData> {
    const student = await studentsService.get(studentId);
    const term = await academicYearsService.getTerm(termId);

    const studentRecord = student ?? {
      id: studentId,
      firstName: "Enter student name",
      lastName: "",
      admissionNumber: "Enter student ID",
      className: "Enter class or grade",
      division: "—",
      gender: "—",
      dateOfBirth: "—",
      classId: "",
    };

    const termRecord = term ?? {
      id: termId,
      name: "Enter term",
      academicYearId: "",
      startDate: "",
      endDate: "",
    };

    const year = termRecord.academicYearId
      ? await academicYearsService.getYear(termRecord.academicYearId)
      : null;
    const academicYear = year?.name ?? "Enter academic year";

    // 1. All subjects for the student's division — so the template is
    //    complete even before any assessments have been created.
    const division = normalizeDivision(studentRecord.division);
    const divisionSubjects = division
      ? await subjectsService
          .list({ division, status: "active" }, 1, 200)
          .then((r) => r.data)
          .catch(() => [])
      : [];

    // 2. Assessments for this class + term.
    const assessmentsRes = studentRecord.classId
      ? await assessmentsService.list(
          {
            classId: studentRecord.classId,
            termId,
            ...(year?.name ? { academicYear: year.name } : {}),
          },
          1,
          200,
        )
      : { data: [], total: 0 };

    const assessmentIds = assessmentsRes.data.map((a) => a.id);

    // 3. Scores + remarks + proficiency in parallel.
    const [allScores, remarks, proficiency] = await Promise.all([
      assessmentIds.length
        ? scoresService.listByAssessmentIds(assessmentIds)
        : Promise.resolve([]),
      remarksService.get(studentId, termId).catch(() => null),
      proficiencyRatingsService
        .list(studentId, termId)
        .catch(() => [] as ReportCardProficiencyRow[]),
    ]);

    // 4. One row per division subject, joined to its assessment + score.
    const rows: ReportCardSubjectRow[] = divisionSubjects.map((subj) => {
      const assessment = assessmentsRes.data.find(
        (a) => a.subjectId === subj.id,
      );
      const score = assessment
        ? allScores.find(
            (s) =>
              s.assessmentId === assessment.id && s.studentId === studentId,
          )
        : undefined;

      return {
        subjectId: subj.id,
        subjectCode: subj.code,
        subjectName: subj.name,
        assessmentRaw: score?.assessmentRaw ?? null,
        assessmentMax: assessment?.maxAssessmentScore ?? 0,
        examRaw: score?.examRaw ?? null,
        examMax: assessment?.maxExamScore ?? 0,
        finalScore: score?.finalScore ?? 0,
        grade: score?.grade ?? "—",
        gradeLabel: score?.gradeLabel ?? "—",
        remark: score?.remark,
      };
    });

    // Totals
    const scored = rows.filter((r) => r.finalScore > 0);
    const totalScore = scored.reduce((sum, r) => sum + r.finalScore, 0);
    const averageScore =
      scored.length === 0
        ? 0
        : Math.round((totalScore / scored.length) * 10) / 10;

    // Position — needs a real class roster.
    let position = 0;
    let classSize = 0;
    if (studentRecord.classId) {
      const roster = await studentsService.list(
        { classId: studentRecord.classId, status: "active" },
        1,
        200,
      );
      classSize = roster.total;
      const studentTotals = roster.data.map((st) => {
        const total = allScores
          .filter((s) => s.studentId === st.id)
          .reduce((sum, s) => sum + s.finalScore, 0);
        return { id: st.id, total };
      });
      const sorted = [...studentTotals].sort((a, b) => b.total - a.total);
      position =
        sorted.findIndex((s) => s.id === studentId) + 1 || sorted.length;
    }

    // Proficiency — always five rows.
    const proficiencyByArea = new Map(
      (proficiency ?? []).map((p) => [p.area, p.rating]),
    );
    const proficiencyRows: ReportCardProficiencyRow[] = PROFICIENCY_AREAS.map(
      (area) => ({
        area,
        rating: proficiencyByArea.get(area) ?? null,
      }),
    );

    return {
      student: {
        id: studentRecord.id,
        fullName:
          `${studentRecord.firstName} ${studentRecord.lastName}`.trim() ||
          "Enter student name",
        admissionNumber: studentRecord.admissionNumber,
        className: studentRecord.className,
        division: studentRecord.division,
        gender: studentRecord.gender,
        dateOfBirth: studentRecord.dateOfBirth,
      },
      term: {
        id: termRecord.id,
        name: termRecord.name,
        academicYear,
        startDate: termRecord.startDate,
        endDate: termRecord.endDate,
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
      proficiency: proficiencyRows,
    };
  },
};
