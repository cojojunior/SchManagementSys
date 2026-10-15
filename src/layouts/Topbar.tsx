import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, LogOut, KeyRound, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useCurrentStudent } from "@/features/auth/useCurrentStudent";
import { ROLE_LABELS } from "@/lib/constants";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, signOut } = useAuth();
  const { student } = useCurrentStudent();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isStudent = user?.role === "student";

  const identity = useMemo(() => {
    if (!user) return null;

    if (isStudent) {
      const name =
        student &&
        `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();
      const displayName = name && name.length > 0 ? name : "Student";
      const subtitle = student
        ? [student.admissionNumber, student.className]
            .filter(Boolean)
            .join(" · ")
        : "Student";
      return {
        displayName,
        subtitle,
        initialsSource: displayName,
        showSchoolLogo: true,
      };
    }

    // Staff
    const displayName =
      user.fullName && user.fullName.length > 0 ? user.fullName : user.email;
    return {
      displayName,
      subtitle: ROLE_LABELS[user.role],
      initialsSource: displayName,
      showSchoolLogo: false,
    };
  }, [user, isStudent, student]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-ink-200">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-ink-100"
          aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">Supreme Academy</div>
        </div>

        {user && identity && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-ink-100 transition-colors"
              aria-haspopup="menu"
              aria-expanded={menuOpen}>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium leading-tight truncate max-w-[180px]">
                  {identity.displayName}
                </div>
                <div className="text-xs text-ink-500 leading-tight truncate max-w-[180px]">
                  {identity.subtitle}
                </div>
              </div>

              <div className="h-9 w-9 rounded-full bg-brand-600 text-white grid place-items-center text-sm font-semibold overflow-hidden">
                {identity.showSchoolLogo ? (
                  <img
                    src="/SUAC-LOGO.svg"
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  identity.initialsSource
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"
                )}
              </div>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-ink-200 shadow-lg py-1 z-40">
                <div className="px-3 py-2 border-b border-ink-200">
                  <div className="text-sm font-medium truncate">
                    {identity.displayName}
                  </div>
                  <div className="text-xs text-ink-500 truncate">
                    {isStudent ? identity.subtitle : user.email}
                  </div>
                </div>

                {isStudent ? (
                  // STUDENT CODE RESET — informational; recovery is in-person
                  <div className="flex items-start gap-2 px-3 py-2 text-xs text-ink-500">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      To reset your 4-digit code, visit the school office.
                    </span>
                  </div>
                ) : (
                  <Link
                    to="/change-password"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
                    onClick={() => setMenuOpen(false)}>
                    <KeyRound className="h-4 w-4" />
                    Change password
                  </Link>
                )}

                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await signOut();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
