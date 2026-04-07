"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

type TurnstileWidgetProps = {
  value: string;
  onChangeAction: (token: string) => void;
  className?: string;
  hiddenInputName?: string;
};

export function TurnstileWidget({
  value,
  onChangeAction,
  className,
  hiddenInputName = "cf-turnstile-response",
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  return (
    <>
      <input type="hidden" name={hiddenInputName} value={value} readOnly />

      <div className={cn("w-full py-1", className)}>
        {siteKey ? (
          <div className="flex w-full justify-center">
            <Turnstile
              className="w-full opacity-90"
              siteKey={siteKey}
              onSuccess={(token) => onChangeAction(token)}
              onExpire={() => onChangeAction("")}
              onError={() => onChangeAction("")}
              options={{
                theme: "auto",
                size: "flexible",
              }}
            />
          </div>
        ) : (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Turnstile not configured</AlertTitle>
            <AlertDescription>
              Add{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                NEXT_PUBLIC_TURNSTILE_SITE_KEY
              </code>{" "}
              to your environment variables.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}
