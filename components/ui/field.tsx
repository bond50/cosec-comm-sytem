import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("text-sm font-medium text-slate-700", className)}
      {...props}
    >
      {children}
      {required ? <span className="ml-1 text-rose-600">*</span> : null}
    </label>
  );
}

export function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[0.82rem] leading-6 text-slate-500", className)}
      {...props}
    />
  );
}

export function FieldError({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p className={cn("text-sm text-rose-600", className)} {...props}>
      {children}
    </p>
  );
}
