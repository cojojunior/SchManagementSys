import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCurrentStudent } from "@/features/auth/useCurrentStudent";
import { reportCardService } from "@/services/report-card";
import { academicYearsService } from "@/services/supabase/academic-years";
import { ReportCardPreview } from "./report-card/ReportCardPreview";
import { downloadReportCard } from "./report-card/download";
import type { ReportCardData } from "@/types/report-card";

export default function StudentReportPage() {
  const { student, loading: studentLoading } = useCurrentStudent();
  const [searchParams] = useSearchParams();
  const termIdFromUrl = searchParams.get("term");

  const [report, setReport] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!student) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Prefer the term the student just unlocked (passed via ?term=…),
        // fall back to the current term.
        let termId = termIdFromUrl;
        if (!termId) {
          const terms = await academicYearsService.listTerms();
          const current = terms.find((t) => t.isCurrent) ?? terms[0];
          termId = current?.id ?? "";
        }
        if (!termId) {
          if (!cancelled) setError("No academic term is configured.");
          return;
        }

        const data = await reportCardService.buildForStudent(
          student.id,
          termId,
        );
        if (!cancelled) setReport(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load report card.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [student, termIdFromUrl]);

  async function handleDownload() {
    if (!report) return;
    setDownloading(true);
    try {
      await downloadReportCard(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  }

  if (studentLoading || loading) {
    return <div className="text-sm text-ink-500">Loading report card…</div>;
  }

  if (!student) {
    return <EmptyState title="Student record not found" />;
  }

  if (error) {
    return (
      <>
        <PageHeader title="My Report Card" />
        <Card>
          <CardBody>
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="Couldn't load your report card"
              description={error}
              action={
                <Link to="/student/results">
                  <Button>Back to results</Button>
                </Link>
              }
            />
          </CardBody>
        </Card>
      </>
    );
  }

  if (!report) return null;

  return (
    <>
      <PageHeader
        title="My Report Card"
        description={`${report.student.className} · ${report.term.name} ${report.term.academicYear}`}
        action={
          <div className="flex gap-2">
            <Link to="/student/results">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4" />
              {downloading ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        }
      />

      <ReportCardPreview data={report} />
    </>
  );
}
