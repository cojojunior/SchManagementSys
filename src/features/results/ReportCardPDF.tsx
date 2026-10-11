import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReportCardData } from "@/types/report-card";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f1318",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#2a41e6",
    paddingBottom: 10,
    marginBottom: 14,
    textAlign: "center",
  },
  schoolName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2a41e6",
  },
  schoolMeta: {
    fontSize: 9,
    color: "#5c6675",
    marginTop: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#dde1e8",
    borderBottomWidth: 1,
    borderBottomColor: "#dde1e8",
    paddingVertical: 8,
  },
  infoItem: {
    width: "50%",
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 90,
    fontSize: 9,
    color: "#5c6675",
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  table: {
    borderWidth: 1,
    borderColor: "#dde1e8",
    marginBottom: 12,
  },
  tHeadRow: {
    flexDirection: "row",
    backgroundColor: "#f7f8fa",
    borderBottomWidth: 1,
    borderBottomColor: "#dde1e8",
    paddingVertical: 6,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f4",
    paddingVertical: 5,
  },
  tHeadCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#3f4855",
    paddingHorizontal: 6,
  },
  tCell: {
    fontSize: 9,
    paddingHorizontal: 6,
  },
  colSubject: { width: "34%" },
  colNum: { width: "11%", textAlign: "right" },
  colGrade: { width: "14%", textAlign: "center" },
  colRemark: { width: "30%" },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dde1e8",
    borderRadius: 4,
    padding: 8,
    marginRight: 6,
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#5c6675",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  remarkBox: {
    borderWidth: 1,
    borderColor: "#dde1e8",
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  remarkLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#3f4855",
    marginBottom: 3,
  },
  remarkValue: {
    fontSize: 10,
    minHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#8b94a3",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#dde1e8",
    paddingTop: 6,
  },
});

export function ReportCardPDF({ data }: { data: ReportCardData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{data.school.name}</Text>
          {data.school.address && (
            <Text style={styles.schoolMeta}>{data.school.address}</Text>
          )}
          {(data.school.phone || data.school.email) && (
            <Text style={styles.schoolMeta}>
              {[data.school.phone, data.school.email]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          )}
        </View>

        <Text style={styles.title}>TERMINAL REPORT CARD</Text>

        {/* Student info */}
        <View style={styles.infoGrid}>
          <Info label="Student" value={data.student.fullName} />
          <Info label="Admission #" value={data.student.admissionNumber} />
          <Info label="Class" value={data.student.className} />
          <Info label="Division" value={data.student.division.toUpperCase()} />
          <Info label="Term" value={data.term.name} />
          <Info label="Academic Year" value={data.term.academicYear} />
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <Summary label="Total Score" value={String(data.totals.totalScore)} />
          <Summary label="Average" value={`${data.totals.averageScore}%`} />
          <Summary
            label="Position"
            value={`${data.totals.position} / ${data.totals.classSize}`}
          />
          <Summary label="Subjects" value={String(data.totals.totalSubjects)} />
        </View>

        {/* Subjects table */}
        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.tHeadCell, styles.colSubject]}>Subject</Text>
            <Text style={[styles.tHeadCell, styles.colNum]}>Assess</Text>
            <Text style={[styles.tHeadCell, styles.colNum]}>Exam</Text>
            <Text style={[styles.tHeadCell, styles.colNum]}>Final</Text>
            <Text style={[styles.tHeadCell, styles.colGrade]}>Grade</Text>
            <Text style={[styles.tHeadCell, styles.colRemark]}>Remark</Text>
          </View>
          {data.subjects.map((r) => (
            <View key={r.subjectId} style={styles.tRow}>
              <Text style={[styles.tCell, styles.colSubject]}>
                {r.subjectName}
              </Text>
              <Text style={[styles.tCell, styles.colNum]}>
                {r.assessmentRaw ?? "-"}/{r.assessmentMax}
              </Text>
              <Text style={[styles.tCell, styles.colNum]}>
                {r.examRaw ?? "-"}/{r.examMax}
              </Text>
              <Text style={[styles.tCell, styles.colNum]}>
                {r.finalScore.toFixed(1)}
              </Text>
              <Text style={[styles.tCell, styles.colGrade]}>
                {r.grade} · {r.gradeLabel}
              </Text>
              <Text style={[styles.tCell, styles.colRemark]}>
                {r.remark ?? "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* Remarks */}
        <View style={styles.remarkBox}>
          <Text style={styles.remarkLabel}>Class Teacher&apos;s Remark</Text>
          <Text style={styles.remarkValue}>{data.teacherRemark ?? "—"}</Text>
        </View>
        <View style={styles.remarkBox}>
          <Text style={styles.remarkLabel}>Headmaster&apos;s Remark</Text>
          <Text style={styles.remarkValue}>{data.headmasterRemark ?? "—"}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated {new Date().toLocaleDateString()} · {data.school.name}
        </Text>
      </Page>
    </Document>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}
