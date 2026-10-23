import { useMemo } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Trophy, Medal, Award } from "lucide-react";
import type { MarkEntryRow } from "@/types/score";

export function SubjectLeaderboard({ rows }: { rows: MarkEntryRow[] }) {
  // 1. Calculate totals and sort
  const rankedStudents = useMemo(() => {
    return [...rows]
      .map((r) => {
        // The total score is the sum of CA (1st + 2nd) and Exam
        const ca1 = r.assessmentRaw || 0;
        const ca2 = r.assessment2Raw || 0;
        const exam = r.examRaw || 0;
        return {
          ...r,
          totalScore: ca1 + ca2 + exam,
        };
      })
      .filter((r) => r.totalScore > 0) // Optional: hide students with 0
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [rows]);

  const topThree = rankedStudents.slice(0, 3);
  const rest = rankedStudents.slice(3);

  return (
    <Card>
      <CardHeader
        title="Subject Leaderboard"
        description="Top performing students in this class and subject."
      />
      <CardBody className="p-0">
        {rankedStudents.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-500">
            No scores have been entered yet.
          </div>
        ) : (
          <div className="divide-y divide-ink-200">
            {/* Top 3 Podium */}
            <div className="p-6 bg-gradient-to-b from-ink-50 to-white flex flex-col sm:flex-row items-end justify-center gap-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center w-32">
                  <div className="text-sm font-semibold text-ink-600 truncate w-full text-center">
                    {topThree[1].studentName}
                  </div>
                  <div className="text-xs text-ink-500 mb-2">
                    {topThree[1].admissionNumber}
                  </div>
                  <div className="w-full h-24 bg-slate-200 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-slate-400">
                    <Medal className="h-6 w-6 text-slate-500 mb-1" />
                    <div className="text-lg font-bold text-slate-700">
                      {topThree[1].totalScore}
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center w-36">
                  <div className="text-sm font-bold text-ink-900 truncate w-full text-center">
                    {topThree[0].studentName}
                  </div>
                  <div className="text-xs text-ink-500 mb-2">
                    {topThree[0].admissionNumber}
                  </div>
                  <div className="w-full h-32 bg-amber-100 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-amber-400">
                    <Trophy className="h-8 w-8 text-amber-500 mb-1" />
                    <div className="text-2xl font-extrabold text-amber-700">
                      {topThree[0].totalScore}
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center w-32">
                  <div className="text-sm font-semibold text-ink-600 truncate w-full text-center">
                    {topThree[2].studentName}
                  </div>
                  <div className="text-xs text-ink-500 mb-2">
                    {topThree[2].admissionNumber}
                  </div>
                  <div className="w-full h-20 bg-orange-100 rounded-t-lg flex flex-col items-center justify-center border-t-4 border-orange-300">
                    <Award className="h-5 w-5 text-orange-600 mb-1" />
                    <div className="text-lg font-bold text-orange-800">
                      {topThree[2].totalScore}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rest of the class */}
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-medium w-16">Pos</th>
                  <th className="text-left px-4 py-2 font-medium">Student</th>
                  <th className="text-left px-4 py-2 font-medium">ID</th>
                  <th className="text-right px-4 py-2 font-medium">
                    Total Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {rest.map((r, i) => (
                  <tr key={r.studentId} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3 text-ink-500 font-medium">
                      {i + 4}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {r.studentName}
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {r.admissionNumber}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink-900">
                      {r.totalScore}
                    </td>
                  </tr>
                ))}
                {rest.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-center text-ink-500">
                      No other students to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
