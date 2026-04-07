"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { cn } from "@/lib/utils";

export const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(function InputOTP({ className, containerClassName, ...props }, ref) {
  return (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
});

export function InputOTPGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props} />
  );
}

export function InputOTPSlot({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];

  return (
    <div
      className={cn(
        "relative flex h-12 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 shadow-sm transition",
        slot.isActive &&
          "border-[var(--brand)] ring-4 ring-[var(--brand-soft)]",
        className,
      )}
    >
      {slot.char ?? <span className="text-slate-300">0</span>}
      {slot.hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-pulse bg-[var(--brand)]" />
        </div>
      ) : null}
    </div>
  );
}

export function InputOTPSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-slate-400", className)} {...props}>
      -
    </div>
  );
}
