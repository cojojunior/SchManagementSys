import type { ReportCardData } from "@/types/report-card";

const RATING_COLS = [
  "Needs Improvement",
  "Satisfactory",
  "Good",
  "Very Good",
  "Excellent",
] as const;

export function ReportCardPreview({ data }: { data: ReportCardData }) {
  const fmt = (n: number | null | undefined) =>
    n == null || n === 0 ? "0.0" : n.toFixed(1);

  const attendanceLabel = data.attendance
    ? `${data.attendance.present} / ${data.attendance.total}`
    : "—";

  const positionLabel =
    data.totals.position > 0
      ? `${data.totals.position} / ${data.totals.classSize}`
      : "—";

  const refId = `RC-${data.student.admissionNumber}-${data.term.name.replace(/\s+/g, "")}`;
  const generatedOn = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[900px] bg-white p-6 text-ink-900 rounded-lg border border-[#002D62]">
      {/* Header */}
      <div className="flex items-stretch overflow-hidden rounded-md border border-[#002D62]">
        <div className="flex w-1/4 items-center justify-center bg-white px-4 py-4">
          <img src="/SUAC-LOGO.svg" alt="" className="h-14 w-14" />
        </div>
        <div className="flex w-1/2 flex-col justify-center bg-[#002D62] px-4 py-4 text-white">
          <div className="text-2xl font-extrabold tracking-tight">
            {data.school.name}
          </div>
          <div className="text-[11px] tracking-widest opacity-80 mt-1">
            MOTTO: LEARNING TODAY, LEADING TOMORROW
          </div>
        </div>
        <div className="flex w-1/4 flex-col items-center justify-center bg-[#f5c518] px-4 py-4 text-[#002D62]">
          <div className="text-xs font-bold tracking-widest">STUDENT</div>
          <div className="text-xl font-extrabold">REPORT CARD</div>
        </div>
      </div>

      {/* Info grid — flush borders */}
      <div className="mt-5 border-t border-l border-[#002D62] text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <InfoRow label="Student Name" value={data.student.fullName} />
          <InfoRow label="Term" value={data.term.name} />
          <InfoRow label="Student ID" value={data.student.admissionNumber} />
          <InfoRow label="Class Teacher" value={data.classTeacherName ?? "—"} />
          <InfoRow label="Class / Grade" value={data.student.className} />
          <InfoRow label="Attendance Rate" value={attendanceLabel} />
          <InfoRow label="Academic Year" value={data.term.academicYear} />
          <InfoRow label="Position" value={positionLabel} />
        </div>
      </div>

      {/* Academic performance */}
      <SectionBar>ACADEMIC PERFORMANCE</SectionBar>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm border-l border-[#002D62]">
          <thead>
            <tr className="bg-[#002D62] text-white">
              <th className="border-b border-r border-[#002D62] px-3 py-2 text-left">
                SUBJECT
              </th>
              <th className="border-b border-r border-[#002D62] px-3 py-2 text-center w-24">
                SCORE
              </th>
              <th className="border-b border-r border-[#002D62] px-3 py-2 text-center w-24">
                GRADE
              </th>
              <th className="border-b border-[#002D62] px-3 py-2">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((s, i) => (
              <tr
                key={s.subjectId}
                className={i % 2 ? "bg-[#f7fafb]" : "bg-white"}>
                <td className="border-b border-r border-[#002D62] px-3 py-2 font-medium">
                  {s.subjectName}
                </td>
                <td className="border-b border-r border-[#002D62] px-3 py-2 text-center tabular-nums font-semibold">
                  {fmt(s.finalScore)}
                </td>
                <td className="border-b border-r border-[#002D62] px-3 py-2 text-center">
                  {s.grade}
                </td>
                <td className="border-b border-[#002D62] px-3 py-2 text-center text-ink-500">
                  {s.remark || "—"}
                </td>
              </tr>
            ))}
            {data.subjects.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="border-b border-[#002D62] px-3 py-6 text-center text-ink-400">
                  No subjects configured for this division.
                </td>
              </tr>
            )}
            <tr className="bg-[#002D62] text-white">
              <td
                colSpan={2}
                className="border-r border-[#002D62] px-3 py-2 text-right font-semibold">
                OVERALL AVERAGE
              </td>
              <td className="bg-[#f5c518] border-r border-[#002D62] px-3 py-2 text-center font-bold text-[#002D62] tabular-nums">
                {fmt(data.totals.averageScore)}
              </td>
              <td className="px-3 py-2 text-right text-sm">
                {data.totals.position > 0
                  ? `Position ${data.totals.position} / ${data.totals.classSize}`
                  : "Overall position"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Teacher comment */}
      <SectionBar>TEACHER COMMENT</SectionBar>
      <div className="min-h-[100px] border border-[#002D62] px-4 py-3 text-sm text-ink-600">
        {data.teacherRemark ||
          "Enter teacher's comment about the student's progress, behavior and attitude."}
      </div>

      {/* Proficiency */}
      <SectionBar>PROFICIENCY RECOGNITION AND ATTITUDE</SectionBar>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm border-l border-[#002D62]">
          <thead>
            <tr className="bg-[#002D62] text-white">
              <th className="border-b border-r border-[#002D62] px-3 py-2 text-left">
                AREA
              </th>
              {RATING_COLS.map((c, i) => (
                <th
                  key={c}
                  className={`border-b border-[#002D62] px-3 py-2 ${
                    i < RATING_COLS.length - 1 ? "border-r" : ""
                  }`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.proficiency ?? []).map((p) => (
              <tr key={p.area}>
                <td className="border-b border-r border-[#002D62] px-3 py-2 font-medium">
                  {p.area}
                </td>
                {RATING_COLS.map((c, i) => (
                  <td
                    key={c}
                    className={`border-b border-[#002D62] px-3 py-2 text-center ${
                      i < RATING_COLS.length - 1 ? "border-r" : ""
                    }`}>
                    <span className="inline-flex h-4 w-4 items-center justify-center border border-[#002D62] align-middle text-[10px] text-[#002D62]">
                      {p.rating === c ? "✓" : ""}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {(data.proficiency ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="border-b border-[#002D62] px-3 py-6 text-center text-ink-400">
                  No proficiency ratings entered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Verification footer */}
      <div className="mt-6 border-t border-[#002D62] pt-3 text-[11px] text-ink-500 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
        <div>
          <div className="font-semibold text-[#002D62]">
            System-generated report card
          </div>
          <div>
            Verify at supremeacademy.netlify.app/verify · Ref{" "}
            <span className="font-mono">{refId}</span>
          </div>
        </div>
        <div className="text-right">
          <div>Generated on {generatedOn}</div>
          <div>Supreme Academy, Accra</div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-r border-b border-[#002D62]">
      <div className="w-1/2 bg-[#002D62] text-white px-3 py-2 font-semibold">
        {label}
      </div>
      <div className="w-1/2 px-3 py-2 border-l border-[#002D62]">{value}</div>
    </div>
  );
}

function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 bg-[#002D62] px-3 py-2 text-sm font-bold tracking-wide text-white rounded-t-sm border-b border-[#002D62]">
      {children}
    </div>
  );
}
