import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="mx-auto h-12 w-12 rounded-2xl bg-ink-100 text-ink-500 grid place-items-center mb-3">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-ink-900">{title}</h3>
      {description && (
        <p className="text-sm text-ink-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
