import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReportCardData } from "@/types/report-card";

const RATING_COLS = [
  "Needs Improvement",
  "Satisfactory",
  "Good",
  "Very Good",
  "Excellent",
] as const;

const s = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#002D62",
  },
  headerRow: { flexDirection: "row", height: 60, border: "1 solid #002D62" },
  logoCell: {
    width: "22%",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 40, height: 40 },
  nameCell: {
    width: "53%",
    backgroundColor: "#002D62",
    color: "white",
    padding: 8,
    justifyContent: "center",
    borderLeft: "1 solid #002D62",
  },
  schoolName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  motto: { fontSize: 6, opacity: 0.8, marginTop: 3, letterSpacing: 1 },
  titleCell: {
    width: "25%",
    backgroundColor: "#f5c518",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    borderLeft: "1 solid #002D62",
  },
  titleTop: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  titleMain: { fontSize: 14, fontFamily: "Helvetica-Bold" },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    borderTop: "1 solid #002D62",
    borderLeft: "1 solid #002D62",
  },
  infoCell: {
    width: "50%",
    flexDirection: "row",
    borderBottom: "1 solid #002D62",
    borderRight: "1 solid #002D62",
  },
  infoLabel: {
    width: "50%",
    backgroundColor: "#002D62",
    color: "white",
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  infoValue: {
    width: "50%",
    padding: 4,
    fontSize: 8,
    borderLeft: "1 solid #002D62",
  },

  sectionBar: {
    backgroundColor: "#002D62",
    color: "white",
    padding: 5,
    marginTop: 10,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderTop: "1 solid #002D62",
    borderLeft: "1 solid #002D62",
    borderRight: "1 solid #002D62",
  },

  tableHead: {
    flexDirection: "row",
    backgroundColor: "#002D62",
    color: "white",
    borderLeft: "1 solid #002D62",
    borderTop: "1 solid #002D62",
  },
  th: {
    flex: 1,
    padding: 4,
    borderRight: "1 solid #002D62",
    borderBottom: "1 solid #002D62",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    fontSize: 7,
  },
  thLeft: {
    flex: 3,
    padding: 4,
    borderRight: "1 solid #002D62",
    borderBottom: "1 solid #002D62",
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  tr: { flexDirection: "row" },
  td: {
    flex: 1,
    padding: 4,
    borderRight: "1 solid #002D62",
    borderBottom: "1 solid #002D62",
    textAlign: "center",
    fontSize: 8,
  },
  tdLeft: {
    flex: 3,
    padding: 4,
    borderRight: "1 solid #002D62",
    borderBottom: "1 solid #002D62",
    fontSize: 8,
  },

  overallRow: {
    flexDirection: "row",
    backgroundColor: "#002D62",
    color: "white",
    borderLeft: "1 solid #002D62",
  },
  yellow: {
    backgroundColor: "#f5c518",
    color: "#002D62",
    fontFamily: "Helvetica-Bold",
  },

  comment: {
    borderLeft: "1 solid #002D62",
    borderRight: "1 solid #002D62",
    borderBottom: "1 solid #002D62",
    minHeight: 60,
    padding: 6,
    color: "#475569",
    fontSize: 8,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1 solid #002D62",
    marginTop: 16,
    paddingTop: 6,
    fontSize: 7,
    color: "#64748b",
  },
  footerBold: { fontFamily: "Helvetica-Bold", color: "#002D62" },
  mono: { fontFamily: "Courier" },
});

export function ReportCardDocument({ data }: { data: ReportCardData }) {
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
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.logoCell}>
            <Image style={s.logo} src="/SUAC-LOGO.svg" />
          </View>
          <View style={s.nameCell}>
            <Text style={s.schoolName}>{data.school.name}</Text>
            <Text style={s.motto}>MOTTO: LEARNING TODAY, LEADING TOMORROW</Text>
          </View>
          <View style={s.titleCell}>
            <Text style={s.titleTop}>STUDENT</Text>
            <Text style={s.titleMain}>REPORT CARD</Text>
          </View>
        </View>

        {/* Info grid */}
        <View style={s.infoGrid}>
          <InfoCell label="Student Name" value={data.student.fullName} />
          <InfoCell label="Term" value={data.term.name} />
          <InfoCell label="Student ID" value={data.student.admissionNumber} />
          <InfoCell
            label="Class Teacher"
            value={data.classTeacherName ?? "—"}
          />
          <InfoCell label="Class / Grade" value={data.student.className} />
          <InfoCell label="Attendance Rate" value={attendanceLabel} />
          <InfoCell label="Academic Year" value={data.term.academicYear} />
          <InfoCell label="Position" value={positionLabel} />
        </View>

        {/* Academic performance */}
        <Text style={s.sectionBar}>ACADEMIC PERFORMANCE</Text>
        <View style={s.tableHead}>
          <Text style={s.thLeft}>SUBJECT</Text>
          <Text style={s.th}>SCORE</Text>
          <Text style={s.th}>GRADE</Text>
          <Text style={s.th}>REMARKS</Text>
        </View>
        {data.subjects.map((row) => (
          <View style={s.tr} key={row.subjectId}>
            <Text style={s.tdLeft}>{row.subjectName}</Text>
            <Text style={s.td}>{fmt(row.finalScore)}</Text>
            <Text style={s.td}>{row.grade}</Text>
            <Text style={s.td}>{row.remark || "—"}</Text>
          </View>
        ))}
        {data.subjects.length === 0 && (
          <View style={s.tr}>
            <Text
              style={[
                s.tdLeft,
                {
                  flex: 6,
                  textAlign: "center",
                  color: "#94a3b8",
                  borderRight: "1 solid #002D62",
                },
              ]}>
              No subjects configured for this division.
            </Text>
          </View>
        )}
        <View style={s.overallRow}>
          <Text
            style={[
              s.tdLeft,
              {
                flex: 4,
                textAlign: "right",
                fontFamily: "Helvetica-Bold",
                borderBottom: "none",
              },
            ]}>
            OVERALL AVERAGE
          </Text>
          <Text style={[s.td, s.yellow]}>{fmt(data.totals.averageScore)}</Text>
          <Text style={[s.td, { textAlign: "right", borderBottom: "none" }]}>
            {data.totals.position > 0
              ? `Position ${data.totals.position} / ${data.totals.classSize}`
              : "Overall position"}
          </Text>
          <Text style={[s.td, { borderBottom: "none" }]} />
        </View>

        {/* Teacher comment */}
        <Text style={s.sectionBar}>TEACHER COMMENT</Text>
        <View style={s.comment}>
          <Text>
            {data.teacherRemark ||
              "Enter teacher's comment about the student's progress, behavior and attitude."}
          </Text>
        </View>

        {/* Proficiency */}
        <Text style={s.sectionBar}>PROFICIENCY RECOGNITION AND ATTITUDE</Text>
        <View style={s.tableHead}>
          <Text style={s.thLeft}>AREA</Text>
          {RATING_COLS.map((c) => (
            <Text key={c} style={s.th}>
              {c}
            </Text>
          ))}
        </View>
        {(data.proficiency ?? []).map((p) => (
          <View style={s.tr} key={p.area}>
            <Text style={s.tdLeft}>{p.area}</Text>
            {RATING_COLS.map((c) => (
              <Text key={c} style={s.td}>
                {p.rating === c ? "X" : ""}
              </Text>
            ))}
          </View>
        ))}
        {(data.proficiency ?? []).length === 0 && (
          <View style={s.tr}>
            <Text
              style={[
                s.tdLeft,
                {
                  flex: 6,
                  textAlign: "center",
                  color: "#94a3b8",
                  borderRight: "1 solid #002D62",
                },
              ]}>
              No proficiency ratings entered yet.
            </Text>
          </View>
        )}

        {/* Verification footer */}
        <View style={s.footer}>
          <View>
            <Text style={s.footerBold}>System-generated report card</Text>
            <Text>
              Verify at supremeacademy.netlify.app/verify · Ref{" "}
              <Text style={s.mono}>{refId}</Text>
            </Text>
          </View>
          <View>
            <Text>Generated on {generatedOn}</Text>
            <Text>Supreme Academy, Accra</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoCell}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}
