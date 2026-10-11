import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full h-10 rounded-lg border bg-white px-3 text-sm text-ink-900",
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
        invalid ? "border-red-400" : "border-ink-200",
        className,
      )}
      {...rest}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";
