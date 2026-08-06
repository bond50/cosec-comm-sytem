import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FloatingInputProps = ComponentProps<typeof Input> & {
  label: string;
  error?: string;
  description?: string;
};

export function FloatingInput({
  id,
  label,
  error,
  description,
  className,
  ...props
}: FloatingInputProps) {
  return (
    <div className="space-y-4">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <Input id={id} className={cn("mt-2", className)} {...props} />
      {description ? (
        <p className="text-sm text-slate-500">{description}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
