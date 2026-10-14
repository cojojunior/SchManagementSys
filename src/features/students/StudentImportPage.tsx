import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RoleGate } from "@/features/auth/RoleGate";
import { parseCsv, rowsToObjects } from "@/utils/csv";
import {
  studentImportService,
  type ValidatedRow,
  type ImportResult,
} from "@/services/supabase/student-import";

const SAMPLE_CSV = `first_name,last_name,other_names,date_of_birth,gender,nationality,division,class_name,academic_year,admission_date,address,previous_school,guardian_name,guardian_relationship,guardian_phone,guardian_email,guardian_address,guardian_is_emergency
Kwame,Mensah,,2013-05-14,male,Ghanaian,jhs,JHS1,2024/2025,2022-09-05,"12 Adenta, Accra",,Akosua Mensah,mother,+233245550101,akosua@example.com,"12 Adenta, Accra",true
Ama,Owusu,,2014-11-22,female,Ghanaian,jhs,JHS2,2024/2025,2023-09-04,"5 East Legon, Accra",,Kojo Owusu,father,+233205550202,,"5 East Legon, Accra",true`;

export default function StudentImportPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ValidatedRow[] | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setParseError(null);
    setRows(null);
    setResult(null);

    const text = await file.text();
    const parsed = parseCsv(text);

    if (parsed.length < 2) {
      setParseError(
        "The file must have a header row and at least one data row.",
      );
      return;
    }

    let objects = rowsToObjects(parsed);
    if (objects.length === 0) {
      setParseError("No data rows found.");
      return;
    }

    // Sort by last_name, then first_name (case-insensitive)
    objects = objects.slice().sort((a, b) => {
      const aLast = (a.last_name ?? "").trim().toLowerCase();
      const bLast = (b.last_name ?? "").trim().toLowerCase();
      if (aLast !== bLast) return aLast < bLast ? -1 : 1;

      const aFirst = (a.first_name ?? "").trim().toLowerCase();
      const bFirst = (b.first_name ?? "").trim().toLowerCase();
      if (aFirst !== bFirst) return aFirst < bFirst ? -1 : 1;

      return 0;
    });

    setFileName(file.name);
    setValidating(true);
    try {
      const validated = await studentImportService.validate(objects);
      setRows(validated);
    } finally {
      setValidating(false);
    }
  }

  async function handleImport() {
    if (!rows) return;
    const valid = rows.filter((r) => r.errors.length === 0);
    if (valid.length === 0) {
      setParseError("No valid rows to import.");
      return;
    }
    setImporting(true);
    try {
      const res = await studentImportService.importRows(valid);
      setResult(res);
    } finally {
      setImporting(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCount = rows?.filter((r) => r.errors.length === 0).length ?? 0;
  const invalidCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;

  return (
    <>
      <PageHeader
        title="Import Students"
        description="Upload a CSV to create students in bulk"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadSample}>
              <Download className="h-4 w-4" />
              Sample CSV
            </Button>
          </div>
        }
      />

      {/* Step 1 — Upload */}
      {!rows && !parseError && (
        <Card>
          <CardBody className="space-y-4">
            <label
              htmlFor="csv-input"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-ink-300 rounded-xl p-10 cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-colors">
              <Upload className="h-8 w-8 text-brand-600" />
              <div className="text-center">
                <div className="font-medium text-ink-900">
                  Click to choose a CSV file
                </div>
                <div className="text-xs text-ink-500 mt-1">
                  First row must be the column header
                </div>
              </div>
              <input
                id="csv-input"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
            </label>

            <div className="text-xs text-ink-500">
              <p className="font-medium text-ink-700 mb-1">Required columns:</p>
              <p className="font-mono text-[11px] leading-relaxed break-all">
                first_name, last_name, date_of_birth, gender, division,
                class_name, academic_year, admission_date, address,
                guardian_name, guardian_relationship, guardian_phone,
                guardian_address
              </p>
              <p className="mt-2">
                Optional: other_names, nationality, previous_school,
                guardian_email, guardian_is_emergency
              </p>
              <p className="mt-2">
                The <code className="font-mono">class_name</code> must match an
                existing class exactly — e.g.{" "}
                <code className="font-mono">Nursery1</code>,{" "}
                <code className="font-mono">KG2</code>,{" "}
                <code className="font-mono">Primary4</code>,{" "}
                <code className="font-mono">JHS1</code>.
              </p>
              <p className="mt-2">
                Download the sample CSV to see the exact format.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {validating && (
        <div className="text-sm text-ink-500 mt-4">Validating…</div>
      )}

      {parseError && (
        <Card>
          <CardBody>
            <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-sm">{parseError}</div>
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setParseError(null);
                  setRows(null);
                }}>
                Try again
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2 — Preview */}
      {rows && !result && (
        <>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <Card className="p-4">
              <div className="text-xs text-ink-500">File</div>
              <div className="text-sm font-medium text-ink-900 truncate">
                {fileName}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">Ready to import</div>
              <div className="text-lg font-semibold text-emerald-700 tabular-nums">
                {validCount}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">With errors (skipped)</div>
              <div className="text-lg font-semibold text-red-700 tabular-nums">
                {invalidCount}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Preview" />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Row</th>
                      <th className="text-left px-3 py-2 font-medium">
                        Status
                      </th>
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-left px-3 py-2 font-medium">Class</th>
                      <th className="text-left px-3 py-2 font-medium">DOB</th>
                      <th className="text-left px-3 py-2 font-medium">
                        Guardian
                      </th>
                      <th className="text-left px-3 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {rows.map((r) => (
                      <tr
                        key={r.raw.rowNumber}
                        className={r.errors.length ? "bg-red-50/40" : ""}>
                        <td className="px-3 py-2 tabular-nums text-ink-500">
                          {r.raw.rowNumber}
                        </td>
                        <td className="px-3 py-2">
                          {r.errors.length === 0 ? (
                            <Badge tone="success">
                              <CheckCircle2 className="h-3 w-3" />
                              OK
                            </Badge>
                          ) : (
                            <Badge tone="danger">
                              <XCircle className="h-3 w-3" />
                              Error
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-ink-900">
                          {r.raw.firstName} {r.raw.lastName}
                        </td>
                        <td className="px-3 py-2 text-ink-600">
                          {r.raw.className}
                        </td>
                        <td className="px-3 py-2 text-ink-600 tabular-nums">
                          {r.raw.dateOfBirth}
                        </td>
                        <td className="px-3 py-2 text-ink-600">
                          {r.raw.guardian.fullName}
                        </td>
                        <td className="px-3 py-2 text-xs text-red-700">
                          {r.errors.join(" · ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setRows(null);
                setFileName(null);
              }}>
              Choose a different file
            </Button>

            <RoleGate resource="students" action="create">
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}>
                <Upload className="h-4 w-4" />
                {importing
                  ? "Importing…"
                  : `Import ${validCount} student${validCount === 1 ? "" : "s"}`}
              </Button>
            </RoleGate>
          </div>
        </>
      )}

      {/* Step 3 — Result */}
      {result && (
        <Card>
          <CardHeader
            title="Import complete"
            description={`${result.imported} imported · ${result.failed} failed`}
          />
          <CardBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Imported</span>
                </div>
                <div className="text-2xl font-semibold text-emerald-700 tabular-nums mt-1">
                  {result.imported}
                </div>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Failed</span>
                </div>
                <div className="text-2xl font-semibold text-red-700 tabular-nums mt-1">
                  {result.failed}
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <div className="text-sm font-medium text-ink-900 mb-2">
                  Failures
                </div>
                <ul className="text-xs space-y-1 text-red-700">
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Link to="/admin/students">
                <Button>View students</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  setRows(null);
                  setResult(null);
                  setFileName(null);
                }}>
                Import another file
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
