import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CreditCard,
  Ticket,
  BarChart3,
  Settings,
  ScrollText,
  UserCog,
  School,
  Calendar,
  Award,
  Percent,
  FileSpreadsheet,
  ClipboardCheck,
  Receipt,
  Banknote,
  FileText,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ROLE_HOME, ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/cn";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<Role, NavItem[]> = {
  super_admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/students", label: "Students", icon: GraduationCap },
    { to: "/admin/staff", label: "Staff", icon: Users },
    { to: "/admin/classes", label: "Classes", icon: School },
    { to: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { to: "/admin/assignments", label: "Assignments", icon: ClipboardList },
    {
      to: "/admin/assessment-weight",
      label: "Assessment Weights",
      icon: Percent,
    },
    { to: "/admin/assessments", label: "Assessments", icon: FileSpreadsheet },
    { to: "/admin/results", label: "Results", icon: ClipboardCheck },
    { to: "/admin/academic-years", label: "Academic Years", icon: Calendar },
    { to: "/admin/grading", label: "Grading", icon: Award },
    { to: "/admin/finance", label: "Finance", icon: CreditCard },
    { to: "/admin/fees", label: "Fee Structures", icon: Receipt },
    { to: "/admin/invoices", label: "Invoices", icon: FileText },
    { to: "/admin/payments", label: "Payments", icon: Banknote },
    { to: "/admin/finance", label: "Finance Overview", icon: BarChart3 },
    { to: "/admin/scratch-cards", label: "Scratch Cards", icon: Ticket },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/admin/users", label: "Users & Roles", icon: UserCog },
    { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],

  headmaster: [
    { to: "/headmaster", label: "Dashboard", icon: LayoutDashboard },
    { to: "/headmaster/review", label: "Results Review", icon: ClipboardList },
    { to: "/headmaster/classes", label: "Classes", icon: School },
    { to: "/headmaster/students", label: "Students", icon: GraduationCap },
    { to: "/headmaster/subjects", label: "Subjects", icon: BookOpen },
    {
      to: "/headmaster/assessment-weight",
      label: "Assessment Weights",
      icon: Percent,
    },
    { to: "/headmaster/results", label: "Results", icon: ClipboardCheck },
    { to: "/headmaster/finance", label: "Finance Overview", icon: BarChart3 },
    {
      to: "/headmaster/assessments",
      label: "Assessments",
      icon: FileSpreadsheet,
    },
    { to: "/headmaster/grading", label: "Grading", icon: Award },
    { to: "/headmaster/fees", label: "Fee Structures", icon: Receipt },
    { to: "/headmaster/invoices", label: "Invoices", icon: FileText },
    { to: "/headmaster/payments", label: "Payments", icon: Banknote },
    {
      to: "/headmaster/academic-years",
      label: "Academic Years",
      icon: Calendar,
    },
    {
      to: "/headmaster/assignments",
      label: "Assignments",
      icon: ClipboardList,
    },
    { to: "/headmaster/staff", label: "Staff", icon: Users },
    { to: "/headmaster/reports", label: "Reports", icon: BarChart3 },
  ],

  teacher: [
    { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { to: "/teacher/marks", label: "Marks Entry", icon: ClipboardList },
    {
      to: "/teacher/assignments",
      label: "My Assignments",
      icon: ClipboardList,
    },
    { to: "/teacher/results", label: "Results", icon: ClipboardCheck },
    { to: "/teacher/assessments", label: "Assessments", icon: FileSpreadsheet },
    { to: "/teacher/reports", label: "Reports", icon: BarChart3 },
    { to: "/teacher/classes", label: "My Classes", icon: School },
  ],

  secretary: [
    { to: "/secretary", label: "Dashboard", icon: LayoutDashboard },
    { to: "/secretary/students", label: "Students", icon: GraduationCap },
    { to: "/secretary/staff", label: "Staff", icon: Users },
    { to: "/secretary/classes", label: "Classes", icon: School },
    { to: "/secretary/subjects", label: "Subjects", icon: BookOpen },
    { to: "/secretary/grading", label: "Grading", icon: Award },
    {
      to: "/secretary/assessment-weight",
      label: "Assessment Weights",
      icon: Percent,
    },
    { to: "/secretary/fees", label: "Fee Structures", icon: Receipt },
    { to: "/secretary/invoices", label: "Invoices", icon: FileText },
    { to: "/secretary/payments", label: "Payments", icon: Banknote },
    {
      to: "/secretary/academic-years",
      label: "Academic Years",
      icon: Calendar,
    },
    { to: "/secretary/finance", label: "Finance", icon: CreditCard },
    { to: "/secretary/scratch-cards", label: "Scratch Cards", icon: Ticket },
    { to: "/secretary/reports", label: "Reports", icon: BarChart3 },
  ],

  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/results", label: "My Results", icon: ClipboardList },
    { to: "/student/fees", label: "My Fees", icon: CreditCard },
  ],
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  const items = NAV[user.role];
  const home = ROLE_HOME[user.role];

  return (
    <nav className="flex flex-col flex-1 overflow-y-auto">
      <div className="p-4 border-b border-ink-200 flex items-center gap-3">
        <img
          src="/assets/logos/school-logo.svg"
          alt=""
          className="h-9 w-9 rounded-lg bg-brand-600 object-contain p-1"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">Supreme Academy</div>
          <div className="text-xs text-ink-500 truncate">
            {ROLE_LABELS[user.role]}
          </div>
        </div>
      </div>

      <ul className="p-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === home}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                )
              }>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
