import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 min-h-[88px]",
        "placeholder:text-ink-400",
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
        invalid ? "border-red-400" : "border-ink-200",
        className,
      )}
      {...rest}
    />
  ),
);
Textarea.displayName = "Textarea";
