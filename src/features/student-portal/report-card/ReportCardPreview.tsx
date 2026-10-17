import type { ReportCardData } from "@/types/report-card";

export function ReportCardPreview({ data }: { data: ReportCardData }) {
  const fmt = (n: number | null | undefined) =>
    n == null || n === 0 ? "0" : n.toFixed(0);

  const calculateAge = (dob: string) => {
    if (!dob) return "—";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age.toString();
  };

  return (
    <div className="mx-auto max-w-[1000px] bg-white p-8 text-black font-serif border border-black">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-2">
          <img
            src="/SUAC-LOGO.svg"
            alt=""
            className="h-20 w-20 object-contain"
          />
        </div>
        <h1 className="text-3xl font-extrabold tracking-widest mb-1 uppercase">
          {data.school.name}
        </h1>
        <p className="text-xs">
          {data.school.address || "Teshi, Accra"}{" "}
          {data.school.phone ? `TEL: ${data.school.phone}` : ""}
          <br />
          {data.school.email ? `EMAIL: ${data.school.email}` : ""}
        </p>
        <h2 className="text-xl font-bold underline mt-4 tracking-wider">
          TERMLY REPORT
        </h2>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div className="space-y-2">
          <div className="flex">
            <span className="w-32 font-semibold">Name of Student:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5">
              {data.student.fullName}
            </span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">Class:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5">
              {data.student.className}
            </span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">Raw Score:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5">
              {data.totals.totalScore} (Average: {data.totals.averageScore}%)
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex">
            <span className="w-24 font-semibold">Date:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5">
              {new Date().toLocaleDateString("en-GB")}
            </span>
          </div>
          <div className="flex">
            <span className="w-24 font-semibold">No. On Roll:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5">
              {data.totals.classSize}
            </span>
          </div>
          <div className="flex">
            <span className="w-24 font-semibold">Age:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5">
              {calculateAge(data.student.dateOfBirth)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-sm font-semibold mb-3">
        {data.term.name} {data.term.academicYear}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1 text-left w-1/3">
                SUBJECTS
              </th>
              <th className="border border-black px-2 py-1 text-center">
                CLASS SCORE
              </th>
              <th className="border border-black px-2 py-1 text-center">
                EXAM SCORE
              </th>
              <th className="border border-black px-2 py-1 text-center">
                TOTAL SCORE
              </th>
              <th className="border border-black px-2 py-1 text-center">
                CLASS AVERAGE
              </th>
              <th className="border border-black px-2 py-1 text-center">
                GRADE
              </th>
              <th className="border border-black px-2 py-1 text-center">
                REMARKS
              </th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((s) => {
              // If your data provides class average per subject, use it.
              // Otherwise this falls back to the overall term average for display purposes.
              const classAvg =
                (s as any).classAverage ?? data.totals.averageScore;
              return (
                <tr key={s.subjectId}>
                  <td className="border border-black px-2 py-1 uppercase">
                    {s.subjectName}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {fmt(s.assessmentRaw)}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {fmt(s.examRaw)}
                  </td>
                  <td className="border border-black px-2 py-1 text-center font-bold">
                    {fmt(s.finalScore)}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {fmt(classAvg)}
                  </td>
                  <td className="border border-black px-2 py-1 text-center font-bold">
                    {s.grade}
                  </td>
                  <td className="border border-black px-2 py-1 text-center text-xs uppercase">
                    {s.remark || "—"}
                  </td>
                </tr>
              );
            })}
            {data.subjects.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="border border-black px-2 py-4 text-center italic text-gray-500">
                  No subjects recorded for this term.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Sections */}
      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <h3 className="font-bold text-center border border-black border-b-0 bg-gray-100 py-1">
            BILL FOR ........ {data.term.name.toUpperCase()}
          </h3>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border-r border-black px-2 py-1 text-left">
                  SCHOOL FEES DETAILS
                </th>
                <th className="px-2 py-1 text-right">AMOUNT TO BE PAID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-t border-r border-black px-2 py-1 h-6">
                  ARREARS FROM LAST TERM
                </td>
                <td className="border-t border-black px-2 py-1 text-right">
                  —
                </td>
              </tr>
              <tr>
                <td className="border-t border-r border-black px-2 py-1 h-6">
                  CURRENT TUITION FEES
                </td>
                <td className="border-t border-black px-2 py-1 text-right">
                  —
                </td>
              </tr>
              <tr>
                <td className="border-t border-r border-black px-2 py-1 h-6">
                  COMPUTER FEES
                </td>
                <td className="border-t border-black px-2 py-1 text-right">
                  —
                </td>
              </tr>
              <tr>
                <td className="border-t border-r border-black px-2 py-1 h-6">
                  TOTAL
                </td>
                <td className="border-t border-black px-2 py-1 text-right font-bold">
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="flex">
            <span className="font-semibold w-32">Attendance:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5">
              {data.attendance
                ? `${data.attendance.present} out of ${data.attendance.total}`
                : "—"}
            </span>
          </div>
          <div className="flex">
            <span className="font-semibold w-32">Interest:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5"></span>
          </div>
          <div className="flex">
            <span className="font-semibold w-32">Conduct:</span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5"></span>
          </div>
          <div className="flex items-start mt-2">
            <span className="font-semibold w-32 shrink-0">
              Class Teacher's Report:
            </span>
            <span className="flex-1 border-b border-dotted border-black pb-0.5 min-h-[3rem] italic">
              {data.teacherRemark ||
                "................................................................"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-start gap-4 text-sm">
        <span className="font-semibold shrink-0">
          Headmaster's Comment/Signature:
        </span>
        <span className="flex-1 border-b border-dotted border-black pb-0.5 min-h-[3rem] italic">
          {data.headmasterRemark ||
            "................................................................"}
        </span>
      </div>
    </div>
  );
}
