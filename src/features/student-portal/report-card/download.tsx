import { pdf } from "@react-pdf/renderer";
import { ReportCardDocument } from "./ReportCardDocument";
import type { ReportCardData } from "@/types/report-card";

export async function downloadReportCard(data: ReportCardData): Promise<void> {
  const blob = await pdf(<ReportCardDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ReportCard_${data.student.admissionNumber}_${data.term.name}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
