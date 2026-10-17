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
    color: "#0b2b45",
  },
  headerRow: { flexDirection: "row", height: 60 },
  logoCell: {
    width: "22%",
    backgroundColor: "#0f6b6b",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 40, height: 40 },
  nameCell: {
    width: "53%",
    backgroundColor: "#0b2b45",
    color: "white",
    padding: 8,
    justifyContent: "center",
  },
  schoolName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  motto: { fontSize: 6, opacity: 0.8, marginTop: 3, letterSpacing: 1 },
  titleCell: {
    width: "25%",
    backgroundColor: "#f5c518",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  titleTop: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  titleMain: { fontSize: 14, fontFamily: "Helvetica-Bold" },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    border: "1 solid #cbd5e1",
  },
  infoCell: {
    width: "50%",
    flexDirection: "row",
    borderBottom: "1 solid #cbd5e1",
  },
  infoLabel: {
    width: "50%",
    backgroundColor: "#f1f5f9",
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  infoValue: { width: "50%", padding: 4, fontSize: 8 },

  sectionBar: {
    backgroundColor: "#0b2b45",
    color: "white",
    padding: 5,
    marginTop: 10,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },

  tableHead: {
    flexDirection: "row",
    backgroundColor: "#0f6b6b",
    color: "white",
  },
  th: {
    flex: 1,
    padding: 4,
    border: "1 solid #cbd5e1",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    fontSize: 7,
  },
  thLeft: {
    flex: 2,
    padding: 4,
    border: "1 solid #cbd5e1",
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  tr: { flexDirection: "row" },
  td: {
    flex: 1,
    padding: 4,
    border: "1 solid #cbd5e1",
    textAlign: "center",
    fontSize: 8,
  },
  tdLeft: { flex: 2, padding: 4, border: "1 solid #cbd5e1", fontSize: 8 },

  overallRow: {
    flexDirection: "row",
    backgroundColor: "#0b2b45",
    color: "white",
  },
  yellow: {
    backgroundColor: "#f5c518",
    color: "#0b2b45",
    fontFamily: "Helvetica-Bold",
  },

  comment: {
    border: "1 solid #cbd5e1",
    minHeight: 60,
    padding: 6,
    color: "#475569",
    fontSize: 8,
  },

  sigRow: {
    flexDirection: "row",
    marginTop: 30,
    justifyContent: "space-between",
  },
  sigCell: {
    width: "22%",
    borderTop: "1 solid #64748b",
    paddingTop: 4,
    textAlign: "center",
    fontSize: 7,
  },
  sigSub: { color: "#94a3b8", fontSize: 6 },
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
            <Text style={s.motto}>MOTTO: DISCOVER TO RECOVER</Text>
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
          <Text style={s.th}>TERM 1</Text>
          <Text style={s.th}>TERM 2</Text>
          <Text style={s.th}>TERM 3</Text>
          <Text style={s.th}>FINAL GRADE</Text>
          <Text style={s.th}>REMARKS / POSITION</Text>
        </View>
        {data.subjects.map((row) => (
          <View style={s.tr} key={row.subjectId}>
            <Text style={s.tdLeft}>{row.subjectName}</Text>
            <Text style={s.td}>{fmt(row.term1Score)}</Text>
            <Text style={s.td}>{fmt(row.term2Score)}</Text>
            <Text style={s.td}>{fmt(row.term3Score)}</Text>
            <Text style={s.td}>{fmt(row.finalScore)}</Text>
            <Text style={s.td}>
              {row.remark || (row.position ? `Pos ${row.position}` : "Enter")}
            </Text>
          </View>
        ))}
        {data.subjects.length === 0 && (
          <View style={s.tr}>
            <Text
              style={[
                s.tdLeft,
                { flex: 6, textAlign: "center", color: "#94a3b8" },
              ]}>
              No subjects entered yet for this term.
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
                borderTop: "1 solid #cbd5e1",
              },
            ]}>
            OVERALL AVERAGE
          </Text>
          <Text style={[s.td, s.yellow]}>{fmt(data.totals.averageScore)}</Text>
          <Text style={[s.td, { textAlign: "right" }]}>
            {data.totals.position > 0
              ? `Position ${data.totals.position} / ${data.totals.classSize}`
              : "Overall position"}
          </Text>
          <Text style={s.td} />
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
                { flex: 6, textAlign: "center", color: "#94a3b8" },
              ]}>
              No proficiency ratings entered yet.
            </Text>
          </View>
        )}

        {/* Signatures */}
        <View style={s.sigRow}>
          {[
            "Class Teacher's Signature",
            "Head of Department (H.O.D)",
            "School Head",
            "Parent / Guardian",
          ].map((l) => (
            <View key={l} style={s.sigCell}>
              <Text>{l}</Text>
              <Text style={s.sigSub}>Name and Signature</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoCell}>
      <Text style={s.infoLabel}>{label} :</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}
