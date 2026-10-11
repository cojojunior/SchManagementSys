import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 rounded-lg border bg-white px-3 text-sm text-ink-900",
        "placeholder:text-ink-400",
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
        "disabled:bg-ink-50 disabled:text-ink-400",
        invalid
          ? "border-red-400 focus:ring-red-400 focus:border-red-400"
          : "border-ink-200",
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = "Input";
