import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "emerald" | "amber" | "red" | "sky";
}) {
  const toneMap = {
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    sky: "bg-sky-50 text-sky-700",
  } as const;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-ink-500">{label}</div>
          <div className="text-2xl font-semibold text-ink-900 mt-1 truncate">
            {value}
          </div>
          {hint && <div className="text-xs text-ink-500 mt-1">{hint}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              "h-10 w-10 rounded-xl grid place-items-center shrink-0",
              toneMap[tone],
            )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
