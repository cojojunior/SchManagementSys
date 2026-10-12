import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Crown,
  GraduationCap,
  FileText,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type RoleCard = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  to: string;
  tone: "brand" | "emerald" | "amber" | "sky" | "red";
};

const ROLES: RoleCard[] = [
  {
    key: "super_admin",
    label: "Super Admin",
    description: "Full system access",
    icon: ShieldCheck,
    to: "/login",
    tone: "red",
  },
  {
    key: "headmaster",
    label: "Headmaster",
    description: "Review & publish results",
    icon: Crown,
    to: "/login",
    tone: "amber",
  },
  {
    key: "teacher",
    label: "Teacher",
    description: "Enter marks & remarks",
    icon: BookOpen,
    to: "/login",
    tone: "sky",
  },
  {
    key: "secretary",
    label: "Secretary",
    description: "Records & finances",
    icon: FileText,
    to: "/login",
    tone: "emerald",
  },
  {
    key: "student",
    label: "Student",
    description: "View results & fees",
    icon: GraduationCap,
    to: "/student/login",
    tone: "brand",
  },
];

const TONE_MAP: Record<RoleCard["tone"], { bg: string; text: string }> = {
  brand: { bg: "bg-brand-50", text: "text-brand-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
  sky: { bg: "bg-sky-50", text: "text-sky-700" },
  red: { bg: "bg-red-50", text: "text-red-700" },
};

export function RolePicker() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-ink-50 px-4 py-10">
      {/* Logo + heading */}
      <div className="text-center motion-safe:animate-[fadeInUp_500ms_ease-out]">
        <img
          src="/SUAC-LOGO.svg"
          alt=""
          className="h-16 w-16 sm:h-20 sm:w-20 mx-auto object-contain select-none"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-ink-900">
          Supreme Academy
        </h1>
        <p className="text-sm text-ink-500 mt-1">Who are you signing in as?</p>
      </div>

      {/* Role cards */}
      <div className="mt-8 w-full max-w-2xl grid gap-3 sm:grid-cols-2">
        {ROLES.map((role, index) => {
          const Icon = role.icon;
          const tone = TONE_MAP[role.tone];
          return (
            <button
              key={role.key}
              onClick={() => navigate(role.to)}
              className={cn(
                "group flex items-center gap-4 p-4 rounded-xl border border-ink-200 bg-white text-left",
                "hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                "transition-all duration-200",
                "motion-safe:animate-[fadeInUp_400ms_ease-out_both]",
                role.key === "student" && "sm:col-span-2",
              )}
              style={{ animationDelay: `${index * 90}ms` }}>
              <div
                className={cn(
                  "h-12 w-12 shrink-0 rounded-xl grid place-items-center transition-transform group-hover:scale-105",
                  tone.bg,
                  tone.text,
                )}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink-900">{role.label}</div>
                <div className="text-xs text-ink-500">{role.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-10 text-xs text-ink-500 flex items-center gap-3 motion-safe:animate-[fadeIn_600ms_ease-out_500ms_both]">
        <a href="/terms" className="hover:text-ink-700">
          Terms
        </a>
        <span className="text-ink-300">·</span>
        <a href="/privacy" className="hover:text-ink-700">
          Privacy
        </a>
      </div>
    </div>
  );
}
