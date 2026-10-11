import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FilePlus, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { useLookup } from "@/hooks/useLookup";
import { studentsService } from "@/services/students";
import { classesService } from "@/services/classes";
import { academicYearsService } from "@/services/academic-years";
import { invoicesService } from "@/services/invoices";

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"student" | "class">("student");
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: students } = useLookup(async () => {
    const res = await studentsService.list({ status: "active" }, 1, 500);
    return res.data;
  });
  const { data: classes } = useLookup(async () => {
    const res = await classesService.list({}, 1, 200);
    return res.data;
  });
  const { data: terms } = useLookup(() => academicYearsService.listTerms());

  async function handleGenerate() {
    if (!termId) return;
    setWorking(true);
    setError(null);
    setResult(null);
    try {
      if (mode === "student") {
        if (!studentId) throw new Error("Select a student");
        const inv = await invoicesService.generateForStudent(studentId, termId);
        setResult(
          `Invoice ${inv.invoiceNumber} created for ${inv.studentName}.`,
        );
      } else {
        if (!classId) throw new Error("Select a class");
        const r = await invoicesService.generateForClass(classId, termId);
        setResult(
          `Created: ${r.created} · Skipped (already existed): ${r.skipped} · Failed: ${r.failed}.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New Invoice"
        description="Generate an invoice from the matching fee structure"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader title="What to generate" />
        <CardBody className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setMode("student")}
              className={[
                "flex items-center gap-3 p-4 rounded-lg border text-left transition-colors",
                mode === "student"
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-200 hover:bg-ink-50",
              ].join(" ")}>
              <FilePlus className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <div className="font-medium">Single student</div>
                <div className="text-xs text-ink-500">
                  Generate one invoice for one student
                </div>
              </div>
            </button>
            <button
              onClick={() => setMode("class")}
              className={[
                "flex items-center gap-3 p-4 rounded-lg border text-left transition-colors",
                mode === "class"
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-200 hover:bg-ink-50",
              ].join(" ")}>
              <Users className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <div className="font-medium">Whole class</div>
                <div className="text-xs text-ink-500">
                  Generate for every active student in a class
                </div>
              </div>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {mode === "student" ? (
              <FormField label="Student" required>
                <Select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}>
                  <option value="">Select a student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} — {s.className}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : (
              <FormField label="Class" required>
                <Select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}>
                  <option value="">Select a class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
            <FormField label="Term" required>
              <Select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}>
                <option value="">Select a term…</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.academicYearId}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="flex items-center justify-end">
            <Button onClick={handleGenerate} disabled={working || !termId}>
              {working ? "Generating…" : "Generate invoice(s)"}
            </Button>
          </div>

          {result && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              {result}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
