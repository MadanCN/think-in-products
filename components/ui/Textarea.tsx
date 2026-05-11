import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-xl bg-bg-secondary border border-border px-4 py-2.5",
            "text-sm text-text-primary placeholder:text-text-muted",
            "transition-all duration-150 outline-none resize-y min-h-[120px]",
            "focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/15",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/15",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
