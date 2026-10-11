import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLookup } from "@/hooks/useLookup";
import { reportCardService } from "@/services/report-card";
import { academicYearsService } from "@/services/supabase/academic-years";
import { ReportCardPDF } from "./ReportCardPDF";
import type { ReportCardData } from "@/types/report-card";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function StudentReportCardPage() {
  const { studentId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const termId = searchParams.get("term") ?? "";

  const { data: terms } = useLookup(() => academicYearsService.listTerms());
  const [report, setReport] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Pick a default term if none provided
  useEffect(() => {
    if (termId || terms.length === 0) return;
    const current = terms.find((t) => t.isCurrent) ?? terms[0];
    if (current) {
      const next = new URLSearchParams(searchParams);
      next.set("term", current.id);
      setSearchParams(next, { replace: true });
    }
  }, [termId, terms, searchParams, setSearchParams]);

  useEffect(() => {
    if (!termId) return;
    setLoading(true);
    reportCardService.buildForStudent(studentId, termId).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [studentId, termId]);

  return (
    <>
      <PageHeader
        title="Report Card"
        description={report?.student.fullName ?? "Loading…"}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {report && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <PDFDownloadLink
                  document={<ReportCardPDF data={report} />}
                  fileName={`report-card-${report.student.admissionNumber}-${report.term.name}.pdf`}>
                  {({ loading: pdfLoading }) => (
                    <Button size="sm" disabled={pdfLoading}>
                      <Download className="h-4 w-4" />
                      {pdfLoading ? "Preparing…" : "Download PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>
              </>
            )}
          </div>
        }
      />

      {/* Term selector */}
      <Card className="mb-6">
        <CardBody className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-ink-700 block mb-1.5">
              Term
            </label>
            <Select
              value={termId}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                next.set("term", e.target.value);
                setSearchParams(next, { replace: true });
              }}>
              <option value="">Select a term…</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.academicYearId}
                  {t.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className="text-sm text-ink-500">Loading…</div>
      ) : !report ? (
        <EmptyState
          title="Report not available"
          description="Either the student or the term could not be found."
        />
      ) : (
        <Card>
          <CardHeader
            title={`${report.student.className} · ${report.term.name}`}
            description={`${report.term.academicYear} · ${formatDate(report.term.startDate)} – ${formatDate(report.term.endDate)}`}
          />
          <CardBody className="space-y-6">
            {/* Student info */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Student" value={report.student.fullName} />
              <Field
                label="Admission #"
                value={report.student.admissionNumber}
                mono
              />
              <Field label="Class" value={report.student.className} />
              <Field
                label="Division"
                value={report.student.division.toUpperCase()}
              />
            </div>

            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Stat label="Total score" value={`${report.totals.totalScore}`} />
              <Stat label="Average" value={`${report.totals.averageScore}%`} />
              <Stat
                label="Position"
                value={`${report.totals.position} / ${report.totals.classSize}`}
              />
              <Stat
                label="Subjects"
                value={String(report.totals.totalSubjects)}
              />
            </div>

            {/* Subjects table */}
            <div className="border border-ink-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Subject
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      Assessment
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium">Exam</th>
                    <th className="text-right px-4 py-2.5 font-medium">
                      Final
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium">Grade</th>
                    <th className="text-left px-4 py-2.5 font-medium">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {report.subjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-ink-500">
                        No subjects recorded for this term.
                      </td>
                    </tr>
                  ) : (
                    report.subjects.map((r) => (
                      <tr key={r.subjectId}>
                        <td className="px-4 py-2">
                          <span className="font-mono text-xs text-ink-500 mr-2">
                            {r.subjectCode}
                          </span>
                          <span className="font-medium text-ink-900">
                            {r.subjectName}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {r.assessmentRaw ?? "—"}
                          <span className="text-ink-400">
                            {" "}
                            / {r.assessmentMax}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {r.examRaw ?? "—"}
                          <span className="text-ink-400"> / {r.examMax}</span>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-semibold">
                          {r.finalScore.toFixed(1)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center h-6 min-w-[1.75rem] px-2 rounded-md text-xs font-semibold",
                              gradeTone(r.grade),
                            )}>
                            {r.grade}
                          </span>
                          <span className="ml-2 text-xs text-ink-500">
                            {r.gradeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-ink-600">
                          {r.remark ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Remarks */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-ink-200 rounded-lg p-4">
                <div className="text-xs text-ink-500 mb-1">
                  Class Teacher&apos;s Remark
                </div>
                <div className="text-sm text-ink-900 min-h-[40px]">
                  {report.teacherRemark ?? "—"}
                </div>
              </div>
              <div className="border border-ink-200 rounded-lg p-4">
                <div className="text-xs text-ink-500 mb-1">
                  Headmaster&apos;s Remark
                </div>
                <div className="text-sm text-ink-900 min-h-[40px]">
                  {report.headmasterRemark ?? "—"}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div className={`text-sm text-ink-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-50 p-3">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-lg font-semibold text-ink-900 tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  );
}

function gradeTone(grade: string): string {
  if (["1", "2", "E", "VG"].includes(grade))
    return "bg-emerald-50 text-emerald-700";
  if (["3", "4", "5", "G"].includes(grade)) return "bg-sky-50 text-sky-700";
  if (["6", "7", "D"].includes(grade)) return "bg-amber-50 text-amber-700";
  if (["8", "9"].includes(grade)) return "bg-red-50 text-red-700";
  return "bg-ink-100 text-ink-600";
}
