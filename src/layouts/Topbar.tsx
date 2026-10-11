import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ROLE_LABELS } from "@/lib/constants";
import { useNavigate } from "react-router-dom";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium leading-tight">
                {user.fullName}
              </div>
              <div className="text-xs text-ink-500 leading-tight">
                {ROLE_LABELS[user.role]}
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white grid place-items-center text-sm font-semibold">
              {user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <button
              onClick={() => {
                signOut();
                navigate("/login");
              }}
              className="p-2 rounded-lg hover:bg-ink-100"
              aria-label="Sign out"
              title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
