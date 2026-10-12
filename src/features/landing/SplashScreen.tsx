import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const SPLASH_DURATION_MS = 10_000;
const SKIP_APPEARS_AFTER_MS = 2_000;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const skipTimer = setTimeout(
      () => setShowSkip(true),
      SKIP_APPEARS_AFTER_MS,
    );
    const endTimer = setTimeout(onComplete, SPLASH_DURATION_MS);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="region"
      aria-label="Loading Supreme Academy"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-ink-50 px-4">
      {/* Logo */}
      <div className="motion-safe:animate-[fadeInScale_900ms_ease-out]">
        <img
          src="/SUAC-LOGO.svg"
          alt="Supreme Academy"
          className="h-32 w-32 sm:h-40 sm:w-40 object-contain select-none"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent && !parent.querySelector("[data-fallback]")) {
              const fallback = document.createElement("div");
              fallback.setAttribute("data-fallback", "true");
              fallback.className =
                "h-32 w-32 sm:h-40 sm:w-40 rounded-3xl bg-brand-600 text-white grid place-items-center text-4xl font-bold select-none";
              fallback.textContent = "SA";
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      {/* Wordmark */}
      <div className="text-center mt-6 motion-safe:animate-[fadeInUp_900ms_ease-out_200ms_both]">
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink-900 tracking-tight">
          Supreme Academy
        </h1>
        <p className="text-sm text-ink-500 mt-1">School Management System</p>
      </div>

      {/* Progress dots */}
      <div
        className="flex items-center gap-1.5 mt-10 motion-safe:animate-[fadeIn_600ms_ease-out_500ms_both]"
        aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-600 motion-safe:animate-[pulse_1.5s_ease-in-out_infinite]" />
        <span
          className="h-1.5 w-1.5 rounded-full bg-brand-600 motion-safe:animate-[pulse_1.5s_ease-in-out_infinite]"
          style={{ animationDelay: "0.2s" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-brand-600 motion-safe:animate-[pulse_1.5s_ease-in-out_infinite]"
          style={{ animationDelay: "0.4s" }}
        />
      </div>

      {/* Skip button (appears after 2s) */}
      <div className="mt-8 h-10">
        {showSkip && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onComplete}
            className="motion-safe:animate-[fadeIn_400ms_ease-out]">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
