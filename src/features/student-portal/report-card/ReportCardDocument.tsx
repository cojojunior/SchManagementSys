import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReportCardData } from "@/types/report-card";

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Times-Roman", color: "#000" },
  header: { textAlign: "center", marginBottom: 15 },
  logo: { width: 60, height: 60, alignSelf: "center", marginBottom: 5 },
  schoolName: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    letterSpacing: 2,
    marginBottom: 4,
  },
  schoolInfo: { fontSize: 8, lineHeight: 1.2 },
  reportTitle: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    marginTop: 10,
    letterSpacing: 1,
  },

  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  infoCol: { width: "48%" },
  infoRow: { flexDirection: "row", marginBottom: 6, alignItems: "flex-end" },
  infoLabel: { width: 90, fontFamily: "Times-Bold" },
  infoValue: { flex: 1, borderBottom: "1 dotted #000", paddingBottom: 2 },

  termTitle: { fontFamily: "Times-Bold", marginBottom: 6 },

  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
  },
  tr: { flexDirection: "row" },
  th: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
    fontFamily: "Times-Bold",
    textAlign: "center",
    backgroundColor: "#f3f4f6",
  },
  thLeft: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
    fontFamily: "Times-Bold",
    flex: 3,
  },
  td: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
    textAlign: "center",
  },
  tdLeft: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
    flex: 3,
    textTransform: "uppercase",
  },
  tdLast: {
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
    textAlign: "center",
    textTransform: "uppercase",
    fontSize: 8,
  },

  footerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  billBox: { width: "48%", borderWidth: 1, borderColor: "#000" },
  billHead: {
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
    textAlign: "center",
    fontFamily: "Times-Bold",
    backgroundColor: "#f3f4f6",
  },
  billRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
  billRowLast: { flexDirection: "row" },
  billTdLeft: { flex: 3, borderRightWidth: 1, borderColor: "#000", padding: 4 },
  billTdRight: { flex: 1, padding: 4, textAlign: "right" },

  rightFooter: { width: "48%" },
  signRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  signLabel: { width: 90, fontFamily: "Times-Bold" },
  signLine: {
    flex: 1,
    borderBottom: "1 dotted #000",
    minHeight: 15,
    fontStyle: "italic",
  },

  bottomFooter: { marginTop: 20, flexDirection: "row", alignItems: "flex-end" },
});

export function ReportCardDocument({ data }: { data: ReportCardData }) {
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
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Image style={s.logo} src="/SUAC-LOGO.svg" />
          <Text style={s.schoolName}>{data.school.name.toUpperCase()}</Text>
          <Text style={s.schoolInfo}>
            {data.school.address || "Teshi, Accra"}{" "}
            {data.school.phone ? `TEL: ${data.school.phone}` : ""}
            {"\n"}
            {data.school.email ? `EMAIL: ${data.school.email}` : ""}
          </Text>
          <Text style={s.reportTitle}>TERMLY REPORT</Text>
        </View>

        {/* Student Info */}
        <View style={s.infoGrid}>
          <View style={s.infoCol}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Name of Student:</Text>
              <Text style={s.infoValue}>{data.student.fullName}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Class:</Text>
              <Text style={s.infoValue}>{data.student.className}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Raw Score:</Text>
              <Text style={s.infoValue}>
                {data.totals.totalScore} (Avg: {data.totals.averageScore}%)
              </Text>
            </View>
          </View>
          <View style={s.infoCol}>
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { width: 60 }]}>Date:</Text>
              <Text style={s.infoValue}>
                {new Date().toLocaleDateString("en-GB")}
              </Text>
            </View>
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { width: 60 }]}>No. On Roll:</Text>
              <Text style={s.infoValue}>{data.totals.classSize}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { width: 60 }]}>Age:</Text>
              <Text style={s.infoValue}>
                {calculateAge(data.student.dateOfBirth)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={s.termTitle}>
          {data.term.name} {data.term.academicYear}
        </Text>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tr}>
            <Text style={s.thLeft}>SUBJECTS</Text>
            <Text style={s.th}>CLASS SCORE</Text>
            <Text style={s.th}>EXAM SCORE</Text>
            <Text style={s.th}>TOTAL SCORE</Text>
            <Text style={s.th}>CLASS AVERAGE</Text>
            <Text style={s.th}>GRADE</Text>
            <Text style={[s.th, { borderRightWidth: 0 }]}>REMARKS</Text>
          </View>
          {data.subjects.map((row, i) => {
            const isLast = i === data.subjects.length - 1;
            const classAvg =
              (row as any).classAverage ?? data.totals.averageScore;
            return (
              <View style={s.tr} key={row.subjectId}>
                <Text
                  style={
                    isLast ? [s.tdLeft, { borderBottomWidth: 0 }] : s.tdLeft
                  }>
                  {row.subjectName}
                </Text>
                <Text style={isLast ? [s.td, { borderBottomWidth: 0 }] : s.td}>
                  {fmt(row.assessmentRaw)}
                </Text>
                <Text style={isLast ? [s.td, { borderBottomWidth: 0 }] : s.td}>
                  {fmt(row.examRaw)}
                </Text>
                <Text
                  style={
                    isLast
                      ? [
                          s.td,
                          { borderBottomWidth: 0, fontFamily: "Times-Bold" },
                        ]
                      : [s.td, { fontFamily: "Times-Bold" }]
                  }>
                  {fmt(row.finalScore)}
                </Text>
                <Text style={isLast ? [s.td, { borderBottomWidth: 0 }] : s.td}>
                  {fmt(classAvg)}
                </Text>
                <Text
                  style={
                    isLast
                      ? [
                          s.td,
                          { borderBottomWidth: 0, fontFamily: "Times-Bold" },
                        ]
                      : [s.td, { fontFamily: "Times-Bold" }]
                  }>
                  {row.grade}
                </Text>
                <Text
                  style={
                    isLast ? [s.tdLast, { borderBottomWidth: 0 }] : s.tdLast
                  }>
                  {row.remark || "—"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer Sections */}
        <View style={s.footerGrid}>
          <View style={s.billBox}>
            <Text style={s.billHead}>
              BILL FOR {data.term.name.toUpperCase()}
            </Text>
            <View
              style={[
                s.billRow,
                { backgroundColor: "#f3f4f6", fontFamily: "Times-Bold" },
              ]}>
              <Text style={s.billTdLeft}>SCHOOL FEES DETAILS</Text>
              <Text style={s.billTdRight}>AMOUNT TO BE PAID</Text>
            </View>
            <View style={s.billRow}>
              <Text style={s.billTdLeft}>ARREARS FROM LAST TERM</Text>
              <Text style={s.billTdRight}>—</Text>
            </View>
            <View style={s.billRow}>
              <Text style={s.billTdLeft}>CURRENT TUITION FEES</Text>
              <Text style={s.billTdRight}>—</Text>
            </View>
            <View style={s.billRowLast}>
              <Text style={s.billTdLeft}>TOTAL</Text>
              <Text style={[s.billTdRight, { fontFamily: "Times-Bold" }]}>
                —
              </Text>
            </View>
          </View>

          <View style={s.rightFooter}>
            <View style={s.signRow}>
              <Text style={s.signLabel}>Attendance:</Text>
              <Text style={s.signLine}>
                {data.attendance
                  ? `${data.attendance.present} out of ${data.attendance.total}`
                  : "—"}
              </Text>
            </View>
            <View style={s.signRow}>
              <Text style={s.signLabel}>Interest:</Text>
              <Text style={s.signLine}></Text>
            </View>
            <View style={s.signRow}>
              <Text style={s.signLabel}>Conduct:</Text>
              <Text style={s.signLine}></Text>
            </View>
            <View style={s.signRow}>
              <Text style={s.signLabel}>Class Teacher's Report:</Text>
              <Text style={[s.signLine, { minHeight: 40 }]}>
                {data.teacherRemark}
              </Text>
            </View>
          </View>
        </View>

        {/* Headmaster Comment */}
        <View style={s.bottomFooter}>
          <Text style={s.signLabel}>Headmaster's Comment/Signature:</Text>
          <Text style={[s.signLine, { minHeight: 40 }]}>
            {data.headmasterRemark}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
