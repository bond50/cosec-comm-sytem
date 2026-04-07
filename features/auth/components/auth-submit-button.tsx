"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type AuthSubmitButtonProps = {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
};

export function AuthSubmitButton({
  children,
  variant = "default",
  className = "w-full rounded-xl",
  disabled = false,
  icon,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={className}
      size="lg"
      type="submit"
      variant={variant}
      disabled={pending || disabled}
    >
      {pending ? (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
          {icon}
        </span>
      ) : null}
      {children}
    </Button>
  );
}
