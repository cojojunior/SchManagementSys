import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { RequireRole } from "@/features/auth/RequireRole";
import { AppShell } from "@/layouts/AppShell";
import LandingPage from "@/pages/LandingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import HeadmasterDashboard from "@/pages/dashboards/HeadmasterDashboard";
import TeacherDashboard from "@/pages/dashboards/TeacherDashboard";
import SecretaryDashboard from "@/pages/dashboards/SecretaryDashboard";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";
import StudentListPage from "@/features/students/StudentListPage";
import StudentDetailPage from "@/features/students/StudentDetailPage";
import StudentFormPage from "@/features/students/StudentFormPage";
import StudentImportPage from "@/features/students/StudentImportPage";
import ClassListPage from "@/features/academics/classes/ClassListPage";
import ClassDetailPage from "@/features/academics/classes/ClassDetailPage";
import ClassFormPage from "@/features/academics/classes/ClassFormPage";
import SubjectListPage from "@/features/academics/subjects/SubjectListPage";
import SubjectDetailPage from "@/features/academics/subjects/SubjectDetailPage";
import SubjectFormPage from "@/features/academics/subjects/SubjectFormPage";
import StaffListPage from "@/features/staff/StaffListPage";
import StaffDetailPage from "@/features/staff/StaffDetailPage";
import StaffFormPage from "@/features/staff/StaffFormPage";
import AssignmentListPage from "@/features/academics/assignments/AssignmentListPage";
import AssignmentDetailPage from "@/features/academics/assignments/AssignmentDetailPage";
import AssignmentFormPage from "@/features/academics/assignments/AssignmentFormPage";
import AcademicYearsPage from "@/features/academics/academic-years/AcademicYearsPage";
import GradingScalesPage from "@/features/academics/grading/GradingScalePage";
import GradingScaleFormPage from "@/features/academics/grading/GradingScaleFormPage";
import AssessmentWeightPage from "@/features/academics/assessment-weight/AssessmentWeightPage";
import AssessmentListPage from "@/features/academics/assessments/AssessmentListPage";
import AssessmentDetailPage from "@/features/academics/assessments/AssessmentDetailPage";
import AssessmentFormPage from "@/features/academics/assessments/AssessmentFormPage";
import MarkEntryPage from "@/features/academics/mark-entry/MarkEntryPage";
import ResultsListPage from "@/features/results/ResultsListPage";
import ResultReviewPage from "@/features/results/ResultReviewPage";
import StudentReportCardPage from "@/features/results/StudentReportCardPage";
import RemarksEditorPage from "@/features/results/RemarksEditorPage";
import FeeStructureListPage from "@/features/finance/fee-structure/FeeStructureListPage";
import FeeStructureDetailPage from "@/features/finance/fee-structure/FeeStructureDetailPage";
import FeeStructureFormPage from "@/features/finance/fee-structure/FeeStructureFormPage";
import InvoiceListPage from "@/features/finance/invoices/InvoiceListPage";
import InvoiceDetailPage from "@/features/finance/invoices/InvoiceDetailPage";
import InvoiceCreatePage from "@/features/finance/invoices/InvoiceCreatePage";
import PaymentListPage from "@/features/finance/payments/PaymentListPage";
import StudentLedgerPage from "@/features/finance/ledger/StudentLedgerPage";
import FinanceDashboardPage from "@/features/finance/dashboard/FinanceDashboardPage";
import ScratchCardListPage from "@/features/scratch-cards/ScratchCardListPage";
import ScratchCardDetailPage from "@/features/scratch-cards/ScratchCardDetailPage";
import ScratchCardGeneratePage from "@/features/scratch-cards/ScratchCardGeneratePage";
import StudentResultsPage from "@/features/student-portal/StudentResultPage";
import StudentReportPage from "@/features/student-portal/StudentReportPage";
import StudentFeesPage from "@/features/student-portal/StudentFeesPage";
import StudentActivatePage from "@/features/student-portal/StudentActivatePage";
import StudentLoginPage from "@/features/student-portal/StudentLoginPage";
import AuditLogPage from "@/features/audit/AuditLogPage";
import ReportsPage from "@/features/reports/ReportsPage";
import SettingsPage from "@/features/settings/SettingsPage";
import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import StaffLoginPage from "@/pages/StaffLoginPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import UserListPage from "@/features/users/UserListPage";
import UserDetailPage from "@/features/users/UserDetailPage";
import UserFormPage from "@/features/users/UserFormPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ============ Public routes ============ */}
        <Route path="/login" element={<StaffLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/student/login" element={<StudentLoginPage />} />
        <Route path="/student/activate" element={<StudentActivatePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/" element={<LandingPage />} />

        {/* ============ Authenticated shell ============ */}
        <Route
          element={
            <RequireRole
              roles={[
                "super_admin",
                "headmaster",
                "teacher",
                "secretary",
                "student",
              ]}>
              <AppShell />
            </RequireRole>
          }>
          {/* Dashboards */}
          <Route
            path="/admin"
            element={
              <RequireRole roles={["super_admin"]}>
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster"
            element={
              <RequireRole roles={["headmaster"]}>
                <HeadmasterDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/teacher"
            element={
              <RequireRole roles={["teacher"]}>
                <TeacherDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/secretary"
            element={
              <RequireRole roles={["secretary"]}>
                <SecretaryDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/student"
            element={
              <RequireRole roles={["student"]}>
                <StudentDashboard />
              </RequireRole>
            }
          />

          {/* Student Portal */}
          <Route
            path="/student/results"
            element={
              <RequireRole roles={["student"]}>
                <StudentResultsPage />
              </RequireRole>
            }
          />
          <Route
            path="/student/report"
            element={
              <RequireRole roles={["student"]}>
                <StudentReportPage />
              </RequireRole>
            }
          />
          <Route
            path="/student/fees"
            element={
              <RequireRole roles={["student"]}>
                <StudentFeesPage />
              </RequireRole>
            }
          />

          {/* ============ Users & Roles (Super Admin only) ============ */}
          <Route
            path="/admin/users"
            element={
              <RequireRole roles={["super_admin"]}>
                <UserListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <UserFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <UserDetailPage />
              </RequireRole>
            }
          />

          {/* Academic Years & Terms */}
          <Route
            path="/admin/academic-years"
            element={
              <RequireRole roles={["super_admin"]}>
                <AcademicYearsPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/academic-years"
            element={
              <RequireRole roles={["headmaster"]}>
                <AcademicYearsPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/academic-years"
            element={
              <RequireRole roles={["secretary"]}>
                <AcademicYearsPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/academic-years"
            element={
              <RequireRole roles={["teacher"]}>
                <AcademicYearsPage />
              </RequireRole>
            }
          />

          {/* Grading Scales */}
          <Route
            path="/admin/grading"
            element={
              <RequireRole roles={["super_admin"]}>
                <GradingScalesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/grading/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <GradingScaleFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/grading/:id/edit"
            element={
              <RequireRole roles={["super_admin"]}>
                <GradingScaleFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/grading"
            element={
              <RequireRole roles={["headmaster"]}>
                <GradingScalesPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/grading"
            element={
              <RequireRole roles={["secretary"]}>
                <GradingScalesPage />
              </RequireRole>
            }
          />

          {/* Assessment Weights */}
          <Route
            path="/admin/assessment-weight"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssessmentWeightPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/assessment-weight"
            element={
              <RequireRole roles={["headmaster"]}>
                <AssessmentWeightPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/assessment-weight"
            element={
              <RequireRole roles={["secretary"]}>
                <AssessmentWeightPage />
              </RequireRole>
            }
          />

          {/* Assessments */}
          <Route
            path="/admin/assessments"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssessmentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/assessments/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssessmentFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/assessments/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssessmentDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/assessments/:id/edit"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssessmentFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/assessments/:id/marks"
            element={
              <RequireRole roles={["super_admin"]}>
                <MarkEntryPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/assessments"
            element={
              <RequireRole roles={["headmaster"]}>
                <AssessmentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/assessments/:id"
            element={
              <RequireRole roles={["headmaster"]}>
                <AssessmentDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/assessments/:id/marks"
            element={
              <RequireRole roles={["headmaster"]}>
                <MarkEntryPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/assessments"
            element={
              <RequireRole roles={["teacher"]}>
                <AssessmentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/assessments/:id"
            element={
              <RequireRole roles={["teacher"]}>
                <AssessmentDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/assessments/:id/marks"
            element={
              <RequireRole roles={["teacher"]}>
                <MarkEntryPage />
              </RequireRole>
            }
          />

          {/* Results */}
          <Route
            path="/admin/results"
            element={
              <RequireRole roles={["super_admin"]}>
                <ResultsListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/results/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <ResultReviewPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/results"
            element={
              <RequireRole roles={["headmaster"]}>
                <ResultsListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/results/:id"
            element={
              <RequireRole roles={["headmaster"]}>
                <ResultReviewPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/results"
            element={
              <RequireRole roles={["teacher"]}>
                <ResultsListPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/results/:id"
            element={
              <RequireRole roles={["teacher"]}>
                <ResultReviewPage />
              </RequireRole>
            }
          />

          {/* Students */}
          <Route
            path="/admin/students"
            element={
              <RequireRole roles={["super_admin"]}>
                <StudentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students/import"
            element={
              <RequireRole roles={["super_admin"]}>
                <StudentImportPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <StudentFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <StudentDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students/:id/edit"
            element={
              <RequireRole roles={["super_admin"]}>
                <StudentFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students/:id/report"
            element={
              <RequireRole roles={["super_admin"]}>
                <StudentReportCardPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students/:id/remarks"
            element={
              <RequireRole roles={["super_admin"]}>
                <RemarksEditorPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/students/:id/ledger"
            element={
              <RequireRole roles={["super_admin"]}>
                <StudentLedgerPage />
              </RequireRole>
            }
          />

          {/* Classes */}
          <Route
            path="/admin/classes"
            element={
              <RequireRole roles={["super_admin"]}>
                <ClassListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/classes/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <ClassFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/classes/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <ClassDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/classes/:id/edit"
            element={
              <RequireRole roles={["super_admin"]}>
                <ClassFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/classes"
            element={
              <RequireRole roles={["headmaster"]}>
                <ClassListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/classes/:id"
            element={
              <RequireRole roles={["headmaster"]}>
                <ClassDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/classes"
            element={
              <RequireRole roles={["teacher"]}>
                <ClassListPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/classes/:id"
            element={
              <RequireRole roles={["teacher"]}>
                <ClassDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/classes"
            element={
              <RequireRole roles={["secretary"]}>
                <ClassListPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/classes/:id"
            element={
              <RequireRole roles={["secretary"]}>
                <ClassDetailPage />
              </RequireRole>
            }
          />

          {/* Subjects */}
          <Route
            path="/admin/subjects"
            element={
              <RequireRole roles={["super_admin"]}>
                <SubjectListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/subjects/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <SubjectFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/subjects/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <SubjectDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/subjects/:id/edit"
            element={
              <RequireRole roles={["super_admin"]}>
                <SubjectFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/subjects"
            element={
              <RequireRole roles={["headmaster"]}>
                <SubjectListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/subjects/:id"
            element={
              <RequireRole roles={["headmaster"]}>
                <SubjectDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/subjects"
            element={
              <RequireRole roles={["secretary"]}>
                <SubjectListPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/subjects/:id"
            element={
              <RequireRole roles={["secretary"]}>
                <SubjectDetailPage />
              </RequireRole>
            }
          />

          {/* Staff */}
          <Route
            path="/admin/staff"
            element={
              <RequireRole roles={["super_admin"]}>
                <StaffListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/staff/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <StaffFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/staff/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <StaffDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/staff/:id/edit"
            element={
              <RequireRole roles={["super_admin"]}>
                <StaffFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/staff"
            element={
              <RequireRole roles={["headmaster"]}>
                <StaffListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/staff/:id"
            element={
              <RequireRole roles={["headmaster"]}>
                <StaffDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/staff"
            element={
              <RequireRole roles={["secretary"]}>
                <StaffListPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/staff/new"
            element={
              <RequireRole roles={["secretary"]}>
                <StaffFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/staff/:id"
            element={
              <RequireRole roles={["secretary"]}>
                <StaffDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/staff/:id/edit"
            element={
              <RequireRole roles={["secretary"]}>
                <StaffFormPage />
              </RequireRole>
            }
          />

          {/* Teaching Assignments */}
          <Route
            path="/admin/assignments"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssignmentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/assignments/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssignmentFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/assignments/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssignmentDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/assignments/:id/edit"
            element={
              <RequireRole roles={["super_admin"]}>
                <AssignmentFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/assignments"
            element={
              <RequireRole roles={["headmaster"]}>
                <AssignmentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/assignments/:id"
            element={
              <RequireRole roles={["headmaster"]}>
                <AssignmentDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/assignments"
            element={
              <RequireRole roles={["teacher"]}>
                <AssignmentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/assignments/:id"
            element={
              <RequireRole roles={["teacher"]}>
                <AssignmentDetailPage />
              </RequireRole>
            }
          />

          {/* Fee Structures */}
          <Route
            path="/admin/fees"
            element={
              <RequireRole roles={["super_admin"]}>
                <FeeStructureListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/fees/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <FeeStructureFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/fees/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <FeeStructureDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/fees/:id/edit"
            element={
              <RequireRole roles={["super_admin"]}>
                <FeeStructureFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/fees"
            element={
              <RequireRole roles={["headmaster"]}>
                <FeeStructureListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/fees/:id"
            element={
              <RequireRole roles={["headmaster"]}>
                <FeeStructureDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/fees"
            element={
              <RequireRole roles={["secretary"]}>
                <FeeStructureListPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/fees/:id"
            element={
              <RequireRole roles={["secretary"]}>
                <FeeStructureDetailPage />
              </RequireRole>
            }
          />

          {/* Invoices */}
          <Route
            path="/admin/invoices"
            element={
              <RequireRole roles={["super_admin"]}>
                <InvoiceListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/invoices/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <InvoiceCreatePage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/invoices/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <InvoiceDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/invoices"
            element={
              <RequireRole roles={["headmaster"]}>
                <InvoiceListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/invoices/:id"
            element={
              <RequireRole roles={["headmaster"]}>
                <InvoiceDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/invoices"
            element={
              <RequireRole roles={["secretary"]}>
                <InvoiceListPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/invoices/new"
            element={
              <RequireRole roles={["secretary"]}>
                <InvoiceCreatePage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/invoices/:id"
            element={
              <RequireRole roles={["secretary"]}>
                <InvoiceDetailPage />
              </RequireRole>
            }
          />

          {/* Payments */}
          <Route
            path="/admin/payments"
            element={
              <RequireRole roles={["super_admin"]}>
                <PaymentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/payments"
            element={
              <RequireRole roles={["headmaster"]}>
                <PaymentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/payments"
            element={
              <RequireRole roles={["secretary"]}>
                <PaymentListPage />
              </RequireRole>
            }
          />

          {/* Student Ledger (Secretary) */}
          <Route
            path="/secretary/students/:id/ledger"
            element={
              <RequireRole roles={["secretary"]}>
                <StudentLedgerPage />
              </RequireRole>
            }
          />

          {/* Audit Log */}
          <Route
            path="/admin/audit"
            element={
              <RequireRole roles={["super_admin"]}>
                <AuditLogPage />
              </RequireRole>
            }
          />

          {/* Reports */}
          <Route
            path="/admin/reports"
            element={
              <RequireRole roles={["super_admin"]}>
                <ReportsPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/reports"
            element={
              <RequireRole roles={["headmaster"]}>
                <ReportsPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/reports"
            element={
              <RequireRole roles={["secretary"]}>
                <ReportsPage />
              </RequireRole>
            }
          />
          <Route
            path="/teacher/reports"
            element={
              <RequireRole roles={["teacher"]}>
                <ReportsPage />
              </RequireRole>
            }
          />

          {/* Settings */}
          <Route
            path="/admin/settings"
            element={
              <RequireRole roles={["super_admin"]}>
                <SettingsPage />
              </RequireRole>
            }
          />

          {/* Finance Dashboard */}
          <Route
            path="/admin/finance"
            element={
              <RequireRole roles={["super_admin"]}>
                <FinanceDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/headmaster/finance"
            element={
              <RequireRole roles={["headmaster"]}>
                <FinanceDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/finance"
            element={
              <RequireRole roles={["secretary"]}>
                <FinanceDashboardPage />
              </RequireRole>
            }
          />

          {/* Scratch Cards */}
          <Route
            path="/admin/scratch-cards"
            element={
              <RequireRole roles={["super_admin"]}>
                <ScratchCardListPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/scratch-cards/new"
            element={
              <RequireRole roles={["super_admin"]}>
                <ScratchCardGeneratePage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/scratch-cards/:id"
            element={
              <RequireRole roles={["super_admin"]}>
                <ScratchCardDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/scratch-cards"
            element={
              <RequireRole roles={["secretary"]}>
                <ScratchCardListPage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/scratch-cards/new"
            element={
              <RequireRole roles={["secretary"]}>
                <ScratchCardGeneratePage />
              </RequireRole>
            }
          />
          <Route
            path="/secretary/scratch-cards/:id"
            element={
              <RequireRole roles={["secretary"]}>
                <ScratchCardDetailPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
