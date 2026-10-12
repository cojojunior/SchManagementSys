import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  CreditCard,
  Ticket,
  BarChart3,
  School,
  FileSpreadsheet,
  ClipboardCheck,
  FileText,
  Banknote,
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
    { to: "/admin/assessments", label: "Assessments", icon: FileSpreadsheet },
    { to: "/admin/results", label: "Results", icon: ClipboardCheck },
    { to: "/admin/finance", label: "Finance", icon: BarChart3 },
    { to: "/admin/scratch-cards", label: "Scratch Cards", icon: Ticket },
  ],

  headmaster: [
    { to: "/headmaster", label: "Dashboard", icon: LayoutDashboard },
    { to: "/headmaster/classes", label: "Classes", icon: School },
    {
      to: "/headmaster/assessments",
      label: "Assessments",
      icon: FileSpreadsheet,
    },
    { to: "/headmaster/results", label: "Results", icon: ClipboardCheck },
    { to: "/headmaster/reports", label: "Reports", icon: BarChart3 },
  ],

  teacher: [
    { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { to: "/teacher/classes", label: "My Classes", icon: School },
    { to: "/teacher/assignments", label: "Assignments", icon: ClipboardList },
    { to: "/teacher/assessments", label: "Assessments", icon: FileSpreadsheet },
    { to: "/teacher/results", label: "Results", icon: ClipboardCheck },
  ],

  secretary: [
    { to: "/secretary", label: "Dashboard", icon: LayoutDashboard },
    { to: "/secretary/students", label: "Students", icon: GraduationCap },
    { to: "/secretary/staff", label: "Staff", icon: Users },
    { to: "/secretary/invoices", label: "Invoices", icon: FileText },
    { to: "/secretary/payments", label: "Payments", icon: Banknote },
    { to: "/secretary/scratch-cards", label: "Scratch Cards", icon: Ticket },
  ],

  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/results", label: "My Results", icon: ClipboardCheck },
    { to: "/student/report", label: "My Report Card", icon: FileText },
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
          src="/SUAC-LOGO.svg"
          alt=""
          className="h-9 w-9 rounded-lg object-contain"
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

      {/* Settings shortcut — only for Super Admin */}
      {user.role === "super_admin" && (
        <div className="mt-auto p-3 border-t border-ink-200">
          <NavLink
            to="/admin/settings"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
              )
            }>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="truncate">Settings</span>
          </NavLink>
        </div>
      )}
    </nav>
  );
}
