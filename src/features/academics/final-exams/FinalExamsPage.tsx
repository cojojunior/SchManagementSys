import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Save } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { teachingAssignmentsService } from "@/services/supabase/teaching-assignments";
import { assessmentsService } from "@/services/supabase/assessments";
import { studentsService } from "@/services/supabase/student";
import { scoresService } from "@/services/supabase/scores";
import type { TeachingAssignment } from "@/types/teaching-assignment";
import type { Student } from "@/types/student";
import type { Assessment } from "@/types/assessment";
import type { MarkEntryRow } from "@/types/score";

export default function FinalExamsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 1. Load the teacher's assignments
  useEffect(() => {
    if (!user?.id) return;
    // Assuming the service uses a filter object
    teachingAssignmentsService
      .list({ teacherId: user.id }, 1, 200)
      .then((res) => {
        setAssignments(res.data);
        if (res.data.length > 0) setSelectedAssignmentId(res.data[0].id);
      })
      .catch(console.error);
  }, [user?.id]);

  // 2. When an assignment is selected, load the students and their current exam scores
  useEffect(() => {
    if (!selectedAssignmentId) return;
    const assignment = assignments.find((a) => a.id === selectedAssignmentId);
    if (!assignment) return;

    setLoading(true);

    assessmentsService
      .list(
        {
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          termId: assignment.termId,
        },
        1,
        1,
      )
      .then(async (res) => {
        const asm = res.data[0];
        if (!asm) {
          setStudents([]);
          setAssessment(null);
          setLoading(false);
          return;
        }
        setAssessment(asm);

        const [roster, existingScores] = await Promise.all([
          studentsService.list(
            { classId: assignment.classId, status: "active" },
            1,
            200,
          ),
          scoresService.listByAssessment(asm.id),
        ]);

        const scoreMap: Record<string, number | null> = {};
        existingScores.forEach((s) => {
          scoreMap[s.studentId] = s.examRaw;
        });

        setStudents(roster.data);
        setScores(scoreMap);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedAssignmentId, assignments]);

  const handleScoreChange = (studentId: string, val: string) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: val === "" ? null : Number(val),
    }));
    setSaved(false);
  };

   const handleSave = async () => {
     if (!assessment) return;
     setSaving(true);

     try {
       const rows: MarkEntryRow[] = students.map((st) => ({
         studentId: st.id,
         studentName: `${st.firstName} ${st.lastName}`,
         admissionNumber: st.admissionNumber,
         assessmentRaw: null,
         assessment2Raw: null,
         examRaw: scores[st.id] ?? null,
         assessmentWeighted: 0,
         examWeighted: 0,
         finalScore: 0,
         grade: "—",
         gradeLabel: "—",
         remark: "",
       }));

       await scoresService.saveScores({ assessmentId: assessment.id, rows });
       setSaved(true);
       setTimeout(() => setSaved(false), 2500);
     } catch (err) {
       console.error("Failed to save exam scores:", err);
     } finally {
       setSaving(false);
     }
   };

  return (
    <>
      <PageHeader
        title="Final Exams"
        description="Manage final examination scores for your assigned classes and subjects."
      />

      <Card className="mb-6">
        <CardBody>
          <label className="text-sm font-medium text-ink-700 block mb-1.5">
            Select Class & Subject
          </label>
          <Select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}>
            {assignments.length === 0 && (
              <option value="">No assignments found</option>
            )}
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.className} - {a.subjectName} ({a.termName})
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Exam Scores"
          description={
            assessment
              ? `Enter the final exam score out of ${assessment.maxExamScore}.`
              : "Select an assignment to begin."
          }
        />
        <CardBody className="p-0">
          {loading ? (
            <div className="p-4 text-sm text-ink-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-4 text-sm text-ink-500">
              No students found for this assignment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Student
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">ID</th>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Final Exam Score
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {students.map((st) => (
                    <tr key={st.id}>
                      <td className="px-4 py-2 font-medium">
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="px-4 py-2 text-ink-500">
                        {st.admissionNumber}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          max={assessment?.maxExamScore ?? 100}
                          className="h-9 w-24 border rounded px-2"
                          value={scores[st.id] ?? ""}
                          onChange={(e) =>
                            handleScoreChange(st.id, e.target.value)
                          }
                        />
                      </td>
                      <td className="px-4 py-2 text-xs text-ink-500">
                        {scores[st.id] !== null && scores[st.id] !== undefined
                          ? "Saved"
                          : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || loading || !assessment}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : saved ? "Saved" : "Save Results"}
        </Button>
      </div>
    </>
  );
}
